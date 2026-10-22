"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FormikHelpers } from "formik"
import * as yup from "yup"
import {
   Tabs,
   TabsContent,
   TabsContents,
   TabsHighlight,
   TabsHighlightItem,
   TabsList,
   TabsTrigger,
} from "@animate-ui/react/primitives/tabs"
import {
   BuildingOffice2Icon,
   CalendarDaysIcon,
   CheckBadgeIcon,
   ClockIcon,
   ComputerDesktopIcon,
   DevicePhoneMobileIcon,
   IdentificationIcon,
   KeyIcon,
   PhoneIcon,
   ShieldCheckIcon,
   UserCircleIcon,
} from "@heroicons/react/24/outline"
import PageHero, { AvatarTile } from "@/app/components/ui/PageHero"
import StatusBadge from "@/app/components/ui/StatusBadge"
import EmptyState from "@/app/components/ui/EmptyState"
import InputField from "@/app/components/ui/InputField"
import Button from "@/app/components/ui/Button"
import AdminNotice from "@/app/components/ui/AdminNotice"
import { FormShell } from "@/app/components/auth/FormShell"
import { useUserDisplaySetter } from "@/app/components/layout/UserDisplayContext"
import { postJson, ApiError } from "@/app/helpers/API"
import { isValidPhone, normalizePhone } from "@/lib/auth/phone"
import { formatJalaliDate } from "@/lib/date/jalali"
import { fa } from "@/lib/i18n/fa"

export interface PanelProfileResponse {
   id: string
   firstName: string
   lastName: string
   username: string
   phone: string | null
   role: "EMPLOYEE" | "IT_SPECIALIST" | "IT_MANAGER" | "SYS_ADMIN"
   status: "ACTIVE" | "SUSPENDED"
   phoneVerifiedAt: string | null
   lastLoginAt: string | null
   mustChangePassword: boolean
   createdAt: string
   updatedAt: string
   employeeProfile: {
      personnelCode: string | null
      jobTitle: string | null
      employmentType: "OFFICIAL" | "CONTRACTUAL" | "TEMPORARY" | "OTHER" | null
      hireDate: string | null
      notes: string | null
      orgUnit: { id: string; name: string } | null
      location: { id: string; floor: string; roomNumber: string } | null
   } | null
   assignedAssets: {
      assignmentId: string
      assignedAt: string
      note: string | null
      asset: {
         id: string
         assetCode: string
         name: string
         category: "HARDWARE" | "SOFTWARE" | "NETWORK"
         type: string
         status: string
      }
   }[]
}

interface ProfileClientProps {
   profile: PanelProfileResponse
}

interface PhoneRequestValues {
   phone: string
}

interface PhoneVerifyValues {
   code: string
}

const phoneSchema = yup.object({
   phone: yup
      .string()
      .trim()
      .required(fa.profile.phoneRequired)
      .test("phone-valid", fa.profile.phoneInvalid, (value) => isValidPhone(value ?? "")),
})

const codeSchema = yup.object({
   code: yup
      .string()
      .trim()
      .required(fa.profile.codeLabel)
      .matches(/^\d{6}$/, fa.profile.invalidCode),
})

interface Challenge {
   id: string
   phone: string
   delivery: "smsir" | "kavenegar" | "console"
}

interface Feedback {
   tone: "success" | "error"
   text: string
}

/**
 * Self-service account surface.
 *
 * Identity fields are read-only on purpose: administrators own names,
 * usernames, roles and statuses. The user may only prove/update their own
 * phone (OTP) and change their password on the dedicated screen.
 */
export default function ProfileClient({ profile }: ProfileClientProps) {
   const router = useRouter()
   const setUser = useUserDisplaySetter()

   const [currentPhone, setCurrentPhone] = useState<string | null>(profile.phone)
   const [phoneVerifiedAt, setPhoneVerifiedAt] = useState<string | null>(profile.phoneVerifiedAt)
   const [challenge, setChallenge] = useState<Challenge | null>(null)
   const [feedback, setFeedback] = useState<Feedback | null>(null)
   const [resending, setResending] = useState(false)

   const displayName = `${profile.firstName} ${profile.lastName}`.trim() || profile.username
   const roleLabel = fa.roles[profile.role] ?? profile.role
   const statusLabel = fa.admin.statuses[profile.status] ?? profile.status
   const statusTone = profile.status === "ACTIVE" ? "approved" : "rejected"

   const requestCode = async (values: PhoneRequestValues, helpers: FormikHelpers<PhoneRequestValues>) => {
      setFeedback(null)
      try {
         const data = await postJson<{ challengeId: string; phone: string; delivery: Challenge["delivery"] }>(
            "/api/panel/phone/request",
            { phone: normalizePhone(values.phone) },
         )
         setChallenge({ id: data.challengeId, phone: data.phone, delivery: data.delivery })
         setFeedback({ tone: "success", text: fa.profile.requestSuccess })
      } catch (err) {
         if (err instanceof ApiError) {
            if (err.errors && Object.keys(err.errors).length > 0) {
               helpers.setErrors(err.errors)
            } else if (err.code === "RATE_LIMIT") {
               setFeedback({ tone: "error", text: fa.profile.rateLimited })
            } else {
               setFeedback({ tone: "error", text: fa.profile.genericError })
            }
         } else {
            console.error("phone code request failed", err)
            setFeedback({ tone: "error", text: fa.profile.genericError })
         }
      } finally {
         helpers.setSubmitting(false)
      }
   }

   const verifyCode = async (values: PhoneVerifyValues, helpers: FormikHelpers<PhoneVerifyValues>) => {
      if (!challenge) return
      setFeedback(null)
      try {
         const data = await postJson<{ ok: true; phone: string }>("/api/panel/phone/verify", {
            challengeId: challenge.id,
            code: values.code.trim(),
         })
         setCurrentPhone(data.phone)
         setPhoneVerifiedAt(new Date().toISOString())
         setChallenge(null)
         setUser((previous) => ({ ...previous, phone: data.phone }))
         setFeedback({ tone: "success", text: fa.profile.verifySuccess })
         router.refresh()
      } catch (err) {
         if (err instanceof ApiError) {
            if (err.errors && Object.keys(err.errors).length > 0) {
               helpers.setErrors(err.errors)
            } else if (err.status === 401 || err.message === "invalid_code") {
               helpers.setErrors({ code: fa.profile.invalidCode })
            } else {
               setFeedback({ tone: "error", text: fa.profile.genericError })
            }
         } else {
            console.error("phone verification failed", err)
            setFeedback({ tone: "error", text: fa.profile.genericError })
         }
      } finally {
         helpers.setSubmitting(false)
      }
   }

   const resendCode = async () => {
      if (!challenge) return
      setResending(true)
      setFeedback(null)
      try {
         const data = await postJson<{ challengeId: string; phone: string; delivery: Challenge["delivery"] }>(
            "/api/panel/phone/request",
            { phone: challenge.phone },
         )
         setChallenge({ id: data.challengeId, phone: data.phone, delivery: data.delivery })
         setFeedback({ tone: "success", text: fa.profile.requestSuccess })
      } catch (err) {
         if (err instanceof ApiError && err.code === "RATE_LIMIT") {
            setFeedback({ tone: "error", text: fa.profile.rateLimited })
         } else {
            console.error("phone code resend failed", err)
            setFeedback({ tone: "error", text: fa.profile.genericError })
         }
      } finally {
         setResending(false)
      }
   }

   return (
      <div className="space-y-8">
         <PageHero
            badge={fa.profile.badge}
            title={fa.profile.heroTitle.replace("{name}", displayName)}
            description={fa.profile.heroDescription}
            leading={<AvatarTile displayName={displayName} />}
            tone="brand"
         />

         <Tabs defaultValue="identity">
            <TabsHighlight className="absolute inset-0 rounded-full bg-brand-500/10">
               <TabsList className="relative flex gap-2 overflow-x-auto rounded-full bg-surface-muted p-1 dark:bg-navy-800">
                  <TabsHighlightItem value="identity" className="flex-1">
                     <TabsTrigger
                        value="identity"
                        className="w-full whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold text-navy-700 transition-colors data-[active]:text-brand-800 dark:text-navy-200 dark:data-[active]:text-brand-200"
                     >
                        {fa.profile.identityTab}
                     </TabsTrigger>
                  </TabsHighlightItem>

                  <TabsHighlightItem value="organization" className="flex-1">
                     <TabsTrigger
                        value="organization"
                        className="w-full whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold text-navy-700 transition-colors data-[active]:text-brand-800 dark:text-navy-200 dark:data-[active]:text-brand-200"
                     >
                        {fa.profile.organizationTab}
                     </TabsTrigger>
                  </TabsHighlightItem>

                  <TabsHighlightItem value="assets" className="flex-1">
                     <TabsTrigger
                        value="assets"
                        className="w-full whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold text-navy-700 transition-colors data-[active]:text-brand-800 dark:text-navy-200 dark:data-[active]:text-brand-200"
                     >
                        {fa.profile.assetsTab}
                     </TabsTrigger>
                  </TabsHighlightItem>

                  <TabsHighlightItem value="phone" className="flex-1">
                     <TabsTrigger
                        value="phone"
                        className="w-full whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold text-navy-700 transition-colors data-[active]:text-brand-800 dark:text-navy-200 dark:data-[active]:text-brand-200"
                     >
                        {fa.profile.phoneTab}
                     </TabsTrigger>
                  </TabsHighlightItem>

                  <TabsHighlightItem value="security" className="flex-1">
                     <TabsTrigger
                        value="security"
                        className="w-full whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold text-navy-700 transition-colors data-[active]:text-brand-800 dark:text-navy-200 dark:data-[active]:text-brand-200"
                     >
                        {fa.profile.securityTab}
                     </TabsTrigger>
                  </TabsHighlightItem>
               </TabsList>
            </TabsHighlight>

            <TabsContents className="mt-6">
               <TabsContent
                  value="identity"
                  className="animate-fade-in-up rounded-3xl border border-border-subtle bg-surface p-6 shadow-xl shadow-navy-900/5 sm:p-8 dark:shadow-black/20"
               >
                  <section aria-label={fa.profile.identitySection}>
                     <div className="flex items-start gap-4">
                        <span
                           aria-hidden="true"
                           className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/12 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200"
                        >
                           <IdentificationIcon className="h-5 w-5" />
                        </span>
                        <div>
                           <h2 className="text-lg font-extrabold text-navy-950 dark:text-white">{fa.profile.identityTitle}</h2>
                           <p className="mt-1 text-sm leading-6 text-navy-600 dark:text-navy-300">{fa.profile.identityDescription}</p>
                        </div>
                     </div>

                     <div className="mt-5 flex items-start gap-3 rounded-2xl border border-accent-500/25 bg-accent-500/10 p-4 text-xs leading-6 text-accent-900 dark:text-accent-100">
                        <ShieldCheckIcon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                        <p>{fa.profile.readOnlyNote}</p>
                     </div>

                     <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <InfoTile
                           icon={<UserCircleIcon className="h-5 w-5" />}
                           label={fa.authPages.fullName}
                           value={`${profile.firstName} ${profile.lastName}`.trim()}
                        />
                        <InfoTile
                           icon={<IdentificationIcon className="h-5 w-5" />}
                           label={fa.profile.usernameLabel}
                           value={profile.username}
                           dir="ltr"
                        />
                        <InfoTile icon={<ShieldCheckIcon className="h-5 w-5" />} label={fa.profile.roleLabel} value={roleLabel} />
                        <InfoTile
                           icon={<CheckBadgeIcon className="h-5 w-5" />}
                           label={fa.profile.statusLabel}
                           value={<StatusBadge tone={statusTone} label={statusLabel} />}
                        />
                        <InfoTile
                           icon={<CalendarDaysIcon className="h-5 w-5" />}
                           label={fa.profile.memberSince}
                           value={formatJalaliDate(profile.createdAt)}
                        />
                        <InfoTile
                           icon={<ClockIcon className="h-5 w-5" />}
                           label={fa.profile.lastLogin}
                           value={
                              profile.lastLoginAt
                                 ? new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                   }).format(new Date(profile.lastLoginAt))
                                 : fa.profile.never
                           }
                        />
                     </dl>
                  </section>
               </TabsContent>

               <TabsContent
                  value="organization"
                  className="animate-fade-in-up rounded-3xl border border-border-subtle bg-surface p-6 shadow-xl shadow-navy-900/5 sm:p-8 dark:shadow-black/20"
               >
                  <section aria-label={fa.profile.organizationSection}>
                     <div className="flex items-start gap-4">
                        <span
                           aria-hidden="true"
                           className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/12 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200"
                        >
                           <BuildingOffice2Icon className="h-5 w-5" />
                        </span>
                        <div>
                           <h2 className="text-lg font-extrabold text-navy-950 dark:text-white">{fa.profile.organizationTitle}</h2>
                           <p className="mt-1 text-sm leading-6 text-navy-600 dark:text-navy-300">{fa.profile.organizationDescription}</p>
                        </div>
                     </div>

                     {!profile.employeeProfile ? (
                        <div className="mt-6">
                           <EmptyState
                              icon={<BuildingOffice2Icon className="h-6 w-6" />}
                              title={fa.profile.organizationEmptyTitle}
                              body={fa.profile.organizationEmptyBody}
                              tone="brand"
                           />
                        </div>
                     ) : (
                        <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                           <InfoTile
                              icon={<IdentificationIcon className="h-5 w-5" />}
                              label={fa.profile.personnelCode}
                              value={profile.employeeProfile.personnelCode ?? fa.profile.notSet}
                              dir="ltr"
                           />
                           <InfoTile
                              icon={<ComputerDesktopIcon className="h-5 w-5" />}
                              label={fa.profile.jobTitle}
                              value={profile.employeeProfile.jobTitle ?? fa.profile.notSet}
                           />
                           <InfoTile
                              icon={<UserCircleIcon className="h-5 w-5" />}
                              label={fa.profile.employmentType}
                              value={
                                 profile.employeeProfile.employmentType
                                    ? fa.employees.employmentTypes[profile.employeeProfile.employmentType] ??
                                      profile.employeeProfile.employmentType
                                    : fa.profile.notSet
                              }
                           />
                           <InfoTile
                              icon={<CalendarDaysIcon className="h-5 w-5" />}
                              label={fa.profile.hireDate}
                              value={
                                 profile.employeeProfile.hireDate
                                    ? formatJalaliDate(profile.employeeProfile.hireDate)
                                    : fa.profile.notSet
                              }
                           />
                           <InfoTile
                              icon={<BuildingOffice2Icon className="h-5 w-5" />}
                              label={fa.profile.orgUnit}
                              value={profile.employeeProfile.orgUnit?.name ?? fa.profile.notSet}
                           />
                           <InfoTile
                              icon={<BuildingOffice2Icon className="h-5 w-5" />}
                              label={fa.profile.location}
                              value={
                                 profile.employeeProfile.location
                                    ? `${profile.employeeProfile.location.floor} / ${profile.employeeProfile.location.roomNumber}`
                                    : fa.profile.notSet
                              }
                           />
                        </dl>
                     )}
                  </section>
               </TabsContent>

               <TabsContent
                  value="assets"
                  className="animate-fade-in-up rounded-3xl border border-border-subtle bg-surface p-6 shadow-xl shadow-navy-900/5 sm:p-8 dark:shadow-black/20"
               >
                  <section aria-label={fa.profile.assetsSection}>
                     <div className="flex items-start gap-4">
                        <span
                           aria-hidden="true"
                           className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/12 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200"
                        >
                           <ComputerDesktopIcon className="h-5 w-5" />
                        </span>
                        <div>
                           <h2 className="text-lg font-extrabold text-navy-950 dark:text-white">{fa.profile.assetsTitle}</h2>
                           <p className="mt-1 text-sm leading-6 text-navy-600 dark:text-navy-300">{fa.profile.assetsDescription}</p>
                        </div>
                     </div>

                     {profile.assignedAssets.length === 0 ? (
                        <div className="mt-6">
                           <EmptyState
                              icon={<ComputerDesktopIcon className="h-6 w-6" />}
                              title={fa.profile.assetsEmptyTitle}
                              body={fa.profile.assetsEmptyBody}
                              tone="accent"
                           />
                        </div>
                     ) : (
                        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                           {profile.assignedAssets.map((assignment) => {
                              const content = (
                                 <>
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                       <div className="min-w-0">
                                          <p className="truncate text-sm font-extrabold text-navy-900 dark:text-white">
                                             {assignment.asset.name}
                                          </p>
                                          <p dir="ltr" className="mt-0.5 font-mono text-[11px] text-brand-700 dark:text-brand-200">
                                             {assignment.asset.assetCode}
                                          </p>
                                       </div>
                                       <StatusBadge
                                          tone={
                                             assignment.asset.status === "ACTIVE"
                                                ? "approved"
                                                : assignment.asset.status === "IN_REPAIR"
                                                  ? "pending"
                                                  : assignment.asset.status === "LOST"
                                                    ? "rejected"
                                                    : "neutral"
                                          }
                                          label={fa.assets.statuses[assignment.asset.status] ?? assignment.asset.status}
                                       />
                                    </div>
                                    <p className="mt-2 text-xs text-navy-600 dark:text-navy-300">
                                       {fa.assets.categories[assignment.asset.category] ?? assignment.asset.category}
                                       {" · "}
                                       {fa.assets.types[assignment.asset.type] ?? assignment.asset.type}
                                    </p>
                                    <p className="mt-1 text-[11px] text-navy-500 dark:text-navy-400">
                                       {fa.profile.assignedAt}: {formatJalaliDate(assignment.assignedAt)}
                                    </p>
                                    {assignment.note ? (
                                       <p className="mt-2 rounded-xl bg-surface-muted/70 px-3 py-2 text-[11px] leading-6 text-navy-600 dark:bg-navy-800/60 dark:text-navy-300">
                                          {assignment.note}
                                       </p>
                                    ) : null}
                                 </>
                              )

                              return (
                                 <li key={assignment.assignmentId}>
                                    {profile.role === "EMPLOYEE" ? (
                                       <div className="h-full rounded-2xl border border-border-subtle p-4">
                                          {content}
                                       </div>
                                    ) : (
                                       <Link
                                          href={`/admin/assets/${assignment.asset.id}`}
                                          className="block h-full rounded-2xl border border-border-subtle p-4 transition-colors hover:border-brand-400 dark:border-navy-700"
                                       >
                                          {content}
                                       </Link>
                                    )}
                                 </li>
                              )
                           })}
                        </ul>
                     )}
                  </section>
               </TabsContent>

               <TabsContent
                  value="phone"
                  className="animate-fade-in-up rounded-3xl border border-border-subtle bg-surface p-6 shadow-xl shadow-navy-900/5 sm:p-8 dark:shadow-black/20"
               >
                  <section aria-label={fa.profile.phoneSection}>
                     <div className="flex items-start gap-4">
                        <span
                           aria-hidden="true"
                           className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/12 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200"
                        >
                           <DevicePhoneMobileIcon className="h-5 w-5" />
                        </span>
                        <div>
                           <h2 className="text-lg font-extrabold text-navy-950 dark:text-white">{fa.profile.phoneTitle}</h2>
                           <p className="mt-1 text-sm leading-6 text-navy-600 dark:text-navy-300">{fa.profile.phoneDescription}</p>
                        </div>
                     </div>

                     <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border-subtle bg-surface-muted px-4 py-3.5">
                        <div className="flex items-center gap-3">
                           <PhoneIcon className="h-5 w-5 text-brand-700 dark:text-brand-200" aria-hidden="true" />
                           <div>
                              <p className="text-xs font-bold text-navy-500 dark:text-navy-400">{fa.profile.currentPhone}</p>
                              <p dir="ltr" className="text-sm font-extrabold text-navy-900 dark:text-white">
                                 {currentPhone ?? fa.profile.phoneNotSet}
                              </p>
                           </div>
                        </div>

                        {currentPhone ? (
                           <StatusBadge
                              tone={phoneVerifiedAt ? "approved" : "pending"}
                              label={phoneVerifiedAt ? fa.profile.phoneVerified : fa.profile.phoneUnverified}
                           />
                        ) : null}
                     </div>

                     {feedback ? (
                        <AdminNotice tone={feedback.tone} className="mt-5">
                           {feedback.text}
                        </AdminNotice>
                     ) : null}

                     <div className="mt-6 max-w-md">
                        <FormShell<PhoneRequestValues>
                           initialValues={{ phone: currentPhone ?? "" }}
                           validationSchema={phoneSchema}
                           onSubmit={requestCode}
                        >
                           {({ isSubmitting, touched, errors }) => (
                              <>
                                 <InputField
                                    name="phone"
                                    label={fa.profile.newPhoneLabel}
                                    placeholder={fa.authPages.phonePlaceholder}
                                    hint={fa.profile.phoneHint}
                                    type="tel"
                                    dir="ltr"
                                    autoComplete="tel"
                                    icon={<PhoneIcon className="h-5 w-5" aria-hidden="true" />}
                                    touched={touched.phone}
                                    error={errors.phone}
                                 />

                                 <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? fa.profile.requesting : fa.profile.requestCode}
                                 </Button>
                              </>
                           )}
                        </FormShell>
                     </div>

                     {challenge ? (
                        <div className="mt-8 max-w-md rounded-2xl border border-brand-500/25 bg-brand-500/[0.06] p-5">
                           <p className="text-sm font-bold text-navy-900 dark:text-white">
                              {fa.profile.requestSuccess}
                           </p>
                           <p dir="ltr" className="mt-1 text-xs font-medium text-navy-600 dark:text-navy-300">
                              {challenge.phone}
                           </p>

                           {challenge.delivery === "console" ? (
                              <p className="mt-3 rounded-xl bg-accent-500/10 px-3 py-2 text-xs leading-6 text-accent-900 dark:text-accent-100">
                                 {fa.profile.devConsoleNote}
                              </p>
                           ) : null}

                           <FormShell<PhoneVerifyValues>
                              key={challenge.id}
                              initialValues={{ code: "" }}
                              validationSchema={codeSchema}
                              onSubmit={verifyCode}
                              className="mt-4 flex flex-col gap-4"
                           >
                              {({ isSubmitting, touched, errors }) => (
                                 <>
                                    <InputField
                                       name="code"
                                       label={fa.profile.codeLabel}
                                       placeholder={fa.profile.codePlaceholder}
                                       type="text"
                                       dir="ltr"
                                       autoComplete="one-time-code"
                                       icon={<KeyIcon className="h-5 w-5" aria-hidden="true" />}
                                       touched={touched.code}
                                       error={errors.code}
                                    />

                                    <div className="flex flex-wrap items-center gap-3">
                                       <Button type="submit" disabled={isSubmitting} fullWidth={false}>
                                          {isSubmitting ? fa.profile.verifying : fa.profile.verifyCode}
                                       </Button>

                                       <button
                                          type="button"
                                          onClick={() => void resendCode()}
                                          disabled={resending}
                                          className="rounded-full px-4 py-2 text-sm font-bold text-brand-700 transition-colors hover:bg-brand-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:text-brand-200 dark:hover:bg-brand-500/15"
                                       >
                                          {resending ? fa.profile.requesting : fa.profile.resendCode}
                                       </button>
                                    </div>
                                 </>
                              )}
                           </FormShell>
                        </div>
                     ) : null}
                  </section>
               </TabsContent>

               <TabsContent
                  value="security"
                  className="animate-fade-in-up rounded-3xl border border-border-subtle bg-surface p-6 shadow-xl shadow-navy-900/5 sm:p-8 dark:shadow-black/20"
               >
                  <section aria-label={fa.profile.passwordSection}>
                     <div className="flex items-start gap-4">
                        <span
                           aria-hidden="true"
                           className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/12 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200"
                        >
                           <KeyIcon className="h-5 w-5" />
                        </span>
                        <div>
                           <h2 className="text-lg font-extrabold text-navy-950 dark:text-white">{fa.profile.passwordTitle}</h2>
                           <p className="mt-1 text-sm leading-6 text-navy-600 dark:text-navy-300">{fa.profile.passwordDescription}</p>
                        </div>
                     </div>

                     <div className="mt-6 rounded-2xl border border-border-subtle bg-surface-muted p-5">
                        <p className="text-xs leading-6 text-navy-600 dark:text-navy-300">{fa.profile.passwordNote}</p>
                        <Link
                           href="/change-password"
                           className="mt-4 inline-flex items-center gap-2 rounded-full bg-linear-to-l from-brand-700 to-brand-800 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-700/25 transition-all duration-300 hover:brightness-110"
                        >
                           <KeyIcon className="h-4 w-4" aria-hidden="true" />
                           {fa.profile.passwordCta}
                        </Link>
                     </div>
                  </section>
               </TabsContent>
            </TabsContents>
         </Tabs>
      </div>
   )
}

function InfoTile({
   icon,
   label,
   value,
   dir,
}: {
   icon?: React.ReactNode
   label: string
   value: React.ReactNode
   dir?: "ltr" | "rtl"
}) {
   return (
      <div className="flex items-center gap-3 rounded-2xl border border-border-subtle bg-surface px-4 py-3.5 shadow-sm">
         {icon ? (
            <span
               aria-hidden="true"
               className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/12 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200"
            >
               {icon}
            </span>
         ) : null}
         <dt className="min-w-0 flex-1 text-xs font-bold text-navy-500 dark:text-navy-400">{label}</dt>
         <dd dir={dir} className="min-w-0 truncate text-sm font-extrabold text-navy-900 dark:text-white">
            {value}
         </dd>
      </div>
   )
}

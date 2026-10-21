"use client"

import { useRouter } from "next/navigation"
import { FormikHelpers } from "formik"
import * as yup from "yup"
import { LockClosedIcon } from "@heroicons/react/24/outline"
import AuthCard from "./AuthCard"
import { FormShell } from "./FormShell"
import Button from "@/app/components/ui/Button"
import PasswordField from "@/app/components/ui/PasswordField"
import { postJson, ApiError } from "@/app/helpers/API"
import { fa } from "@/lib/i18n/fa"

interface ChangePasswordValues {
   currentPassword: string
   newPassword: string
   confirmPassword: string
}

const strongPassword = /^(?=.*[A-Za-z])(?=.*[0-9]).{10,128}$/

const passwordSchema = yup.object({
   currentPassword: yup.string().required(fa.changePassword.currentRequired),
   newPassword: yup
      .string()
      .required(fa.changePassword.newRequired)
      .matches(strongPassword, fa.changePassword.policyHint),
   confirmPassword: yup
      .string()
      .required(fa.changePassword.confirmRequired)
      .oneOf([yup.ref("newPassword")], fa.changePassword.mismatch),
})

/**
 * Forced first-login change and voluntary password change share this form.
 * The server re-validates the current password and the policy; this only
 * provides fast feedback.
 */
export default function ChangePasswordForm({ forced }: { forced: boolean }) {
   const router = useRouter()

   const handleSubmit = async (values: ChangePasswordValues, helpers: FormikHelpers<ChangePasswordValues>) => {
      try {
         await postJson("/api/panel/password", {
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
         })
         router.replace("/panel")
         router.refresh()
      } catch (err) {
         if (err instanceof ApiError) {
            if (err.errors && Object.keys(err.errors).length) helpers.setErrors(err.errors)
            else if (err.status === 401) helpers.setErrors({ currentPassword: fa.changePassword.currentWrong })
            else helpers.setErrors({ currentPassword: fa.changePassword.genericError })
         } else {
            console.error("password change failed", err)
            helpers.setErrors({ currentPassword: fa.changePassword.genericError })
         }
      } finally {
         helpers.setSubmitting(false)
      }
   }

   return (
      <AuthCard delay={0.16}>
         <h2 className="text-2xl font-extrabold leading-tight text-navy-950 dark:text-white">
            {forced ? fa.changePassword.forcedHeading : fa.changePassword.heading}
         </h2>
         <p className="mb-6 mt-2 text-[15px] leading-7 text-navy-600 dark:text-navy-300">
            {forced ? fa.changePassword.forcedSubtitle : fa.changePassword.subtitle}
         </p>

         <div className="mb-5 flex items-start gap-3 rounded-2xl border border-accent-500/25 bg-accent-500/10 p-4 text-xs leading-6 text-accent-900 dark:text-accent-100">
            <LockClosedIcon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p>{fa.changePassword.policyHint}</p>
         </div>

         <FormShell<ChangePasswordValues>
            initialValues={{ currentPassword: "", newPassword: "", confirmPassword: "" }}
            validationSchema={passwordSchema}
            onSubmit={handleSubmit}
         >
            {({ isSubmitting, touched, errors }) => (
               <>
                  <PasswordField
                     name="currentPassword"
                     label={fa.changePassword.currentPassword}
                     autoComplete="current-password"
                     touched={touched.currentPassword}
                     error={errors.currentPassword}
                  />

                  <PasswordField
                     name="newPassword"
                     label={fa.changePassword.newPassword}
                     autoComplete="new-password"
                     hint={fa.changePassword.policyHint}
                     touched={touched.newPassword}
                     error={errors.newPassword}
                  />

                  <PasswordField
                     name="confirmPassword"
                     label={fa.changePassword.confirmPassword}
                     autoComplete="new-password"
                     touched={touched.confirmPassword}
                     error={errors.confirmPassword}
                  />

                  <Button type="submit" disabled={isSubmitting} className="mt-2">
                     {isSubmitting ? fa.authPages.pleaseWait : fa.changePassword.submit}
                  </Button>
               </>
            )}
         </FormShell>
      </AuthCard>
   )
}

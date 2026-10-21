"use client"

import { Formik, Form, type FormikHelpers, type FormikProps, type FormikValues } from "formik"
import type { ObjectSchema } from "yup"
import type { ReactNode } from "react"

/**
 * Generic Formik shell shared by all forms (login, password change, admin
 * user create/edit, phone verification) — the reference's FormShell. It only
 * owns the `<Formik><Form>` boilerplate; fields stay custom per form.
 */
export function FormShell<T extends FormikValues>({
   initialValues,
   validationSchema,
   onSubmit,
   children,
   className = "flex flex-col gap-4",
   validateOnBlur = true,
   validateOnChange = true,
}: {
   initialValues: T
   validationSchema?: ObjectSchema<Record<string, unknown>>
   onSubmit: (values: T, helpers: FormikHelpers<T>) => void | Promise<void>
   children: (bag: FormikProps<T>) => ReactNode
   className?: string
   validateOnBlur?: boolean
   validateOnChange?: boolean
}) {
   return (
      <Formik
         initialValues={initialValues}
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         validationSchema={validationSchema as any}
         onSubmit={onSubmit}
         validateOnBlur={validateOnBlur}
         validateOnChange={validateOnChange}
      >
         {(bag) => (
            <Form className={className} noValidate>
               {children(bag)}
            </Form>
         )}
      </Formik>
   )
}

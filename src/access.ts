import type { Access, FieldAccess } from 'payload'

export const isLoggedIn: Access = ({ req }) => Boolean(req.user)

export const isLoggedInField: FieldAccess = ({ req }) => Boolean(req.user)

export const anyone: Access = () => true

/** Veřejnost vidí jen publikované dokumenty, přihlášený uživatel vše. */
export const publishedOrLoggedIn: Access = ({ req }) => {
  if (req.user) return true
  return { _status: { equals: 'published' } }
}

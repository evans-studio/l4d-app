import { redirect } from 'next/navigation'

export default function AdminNewBookingRedirectPage() {
  // Redirect admin to the unified booking flow in admin mode
  redirect('/book?mode=admin')
}



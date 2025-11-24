import { notFound } from 'next/navigation'

export default function AdminCatchAll() {
    // Force not-found to be shown for any non-existent admin route
    notFound()
}


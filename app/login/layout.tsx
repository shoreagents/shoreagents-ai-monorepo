export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // No sidebar for login pages
  return <div>{children}</div>
}


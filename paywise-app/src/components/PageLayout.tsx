type Props = {
  children: React.ReactNode
}

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page">
      <div className="page-line" />
      <div className="page-content">{children}</div>
      <div className="page-line" />
    </div>
  )
}
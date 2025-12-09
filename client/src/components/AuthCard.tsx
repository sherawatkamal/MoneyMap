/* AuthCard.tsx

Kamal Sherawat Virginia Tech August 22, 2025

Reusable card component wrapper for authentication pages with consistent styling
for title, subtitle, body content, and footer sections.

*/

import React from 'react'

type AuthCardProps = {
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export default function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="auth-card">
      <div className="auth-card-header">
        <h1>{title}</h1>
        {subtitle ? <p className="auth-card-subtitle">{subtitle}</p> : null}
      </div>
      <div className="auth-card-body">{children}</div>
      {footer ? <div className="auth-card-footer">{footer}</div> : null}
    </div>
  )
}



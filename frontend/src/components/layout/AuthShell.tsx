import { Outlet } from 'react-router-dom'

export default function AuthShell() {
  return (
    <div className="min-h-dvh grid place-items-center bg-white text-gray-900">
      <Outlet />
    </div>
  )
}

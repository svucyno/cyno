import { Inter } from 'next/font/google'
import './globals.css'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import 'react-toastify/dist/ReactToastify.css'
import { ToastContainer } from 'react-toastify'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Event Management System',
  description: 'A comprehensive system for managing events and participants',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex h-screen bg-gray-100">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
              {children}
            </main>
          </div>
        </div>
        <ToastContainer position="top-right" autoClose={3000} />
      </body>
    </html>
  )
}

import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="mt-32 border-t border-gray-100">
      <div className="mx-auto max-w-content px-6 py-12">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Personal Website. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              href="https://github.com/zanghuohua256791"
              target="_blank"
              className="text-sm text-gray-400 transition-colors hover:text-[#1A1A1A]"
            >
              GitHub
            </Link>
            <Link
              href="/travel/admin"
              className="text-sm text-gray-400 transition-colors hover:text-[#1A1A1A]"
            >
              管理
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

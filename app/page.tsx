import { WalletComponent } from "@/components/wallet"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShoppingBag } from "lucide-react"


export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-center mb-8 text-slate-800 dark:text-slate-100">PYUSD Transfer</h1>
        <WalletComponent />

        <div className="mt-8 flex flex-col items-center">
          <h2 className="text-2xl font-semibold mb-4 text-slate-800 dark:text-slate-100">Ready to shop?</h2>
          <p className="text-center mb-6 text-slate-600 dark:text-slate-30">
            Visit our marketplace to browse and purchase items using your PYUSD balance.
          </p>
          <Link href="/marketplace">
          <Button className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Go to MarketPlace
          </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
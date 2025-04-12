import { WalletComponent } from "@/components/wallet"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingBag, Shield, Zap, Search, TrendingUp, Lock } from "lucide-react"
import { NetworkStatus } from "@/components/network-status"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col items-center p-4">
      {/* Hero Section */}
      <section className="w-full max-w-6xl mx-auto py-12 md:py-20 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-slate-800 dark:text-slate-100 tracking-tight">
          PYUSD <span className="text-blue-600">Blockchain</span> Explorer
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-8">
          A comprehensive platform for transferring PYUSD, exploring transactions, and shopping in our marketplace with
          enhanced privacy and security.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link href="/explorer">
            <Button size="lg" className="w-full  sm:w-auto">
              <Search className="mr-2 h-5 w-5" />
              Explore Blockchain
            </Button>
          </Link>
          <Link href="/marketplace">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              <ShoppingBag className="mr-2 h-5 w-5" />
              Visit Marketplace
            </Button>
          </Link>
        </div>

        {/* Network Status Card */}
        <div className="mb-12 max-w-md mx-auto">
          <Card className="border border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Google Blockchain RPC Status</CardTitle>
              <CardDescription>Current network performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <NetworkStatus />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Wallet Section */}
      <section className="w-full max-w-6xl mx-auto mb-16 px-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold mb-6 text-center text-slate-800 dark:text-slate-100">Your PYUSD Wallet</h2>
          <WalletComponent />
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full max-w-6xl mx-auto mb-16 px-4">
        <h2 className="text-3xl font-bold text-center mb-12 text-slate-800 dark:text-slate-100">
          Why Use Our Platform
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <Zap className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Google Blockchain RPC</CardTitle>
              <CardDescription>Powered by Google's high-performance blockchain infrastructure</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-300">
                Our application leverages Google's Blockchain RPC for fast, reliable transaction processing and
                blockchain data retrieval with minimal latency and maximum uptime.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <Shield className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Enhanced Privacy</CardTitle>
              <CardDescription>Secure transactions with privacy-preserving features</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-300">
                Transfer PYUSD with confidence using our advanced privacy features, including zero-knowledge proofs and
                transaction obfuscation techniques.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <TrendingUp className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Analytics & Insights</CardTitle>
              <CardDescription>Comprehensive blockchain analytics and monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-300">
                Access detailed transaction history, network performance metrics, and market trends to make informed
                decisions about your PYUSD assets.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Marketplace Promo Section */}
      <section className="w-full max-w-6xl mx-auto mb-16 px-4">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg p-8 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-6 md:mb-0 md:mr-8">
              <h2 className="text-3xl font-bold mb-4">Shop with PYUSD</h2>
              <p className="text-blue-100 mb-6 max-w-xl">
                Our integrated marketplace allows you to spend your PYUSD on a variety of products and services. Enjoy
                secure, private transactions with instant settlement.
              </p>
              <Link href="/marketplace">
                <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-blue-50">
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  Explore Marketplace
                </Button>
              </Link>
            </div>
            <div className="flex-shrink-0 bg-white/10 p-6 rounded-lg backdrop-blur-sm border border-white/20">
              <Lock className="h-24 w-24 text-white" />
            </div>
          </div>
        </div>
      </section>

      {/* Getting Started Section */}
      <section className="w-full max-w-6xl mx-auto mb-16 px-4">
        <h2 className="text-3xl font-bold text-center mb-8 text-slate-800 dark:text-slate-100">Getting Started</h2>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
          <ol className="list-decimal list-inside space-y-4 text-slate-600 dark:text-slate-300">
            <li className="pl-2">
              <span className="font-semibold text-slate-800 dark:text-slate-100">Connect your wallet</span> - Use the
              wallet component above to connect to your PYUSD wallet
            </li>
            <li className="pl-2">
              <span className="font-semibold text-slate-800 dark:text-slate-100">Explore the blockchain</span> - View
              transaction history, analyze network performance, and monitor your assets
            </li>
            <li className="pl-2">
              <span className="font-semibold text-slate-800 dark:text-slate-100">Transfer PYUSD</span> - Send tokens to
              other users with enhanced privacy features
            </li>
            <li className="pl-2">
              <span className="font-semibold text-slate-800 dark:text-slate-100">Shop in the marketplace</span> - Browse
              products and services available for purchase with PYUSD
            </li>
          </ol>
        </div>
      </section>
    </main>
  )
}

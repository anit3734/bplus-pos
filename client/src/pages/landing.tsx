import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, 
  Store, 
  Users, 
  BarChart3, 
  Shield, 
  Smartphone, 
  Zap, 
  Clock,
  CheckCircle,
  ArrowRight,
  Github,
  Globe,
  Settings
} from "lucide-react";

export default function LandingPage() {
  const features = [
    {
      icon: <ShoppingCart className="h-8 w-8 text-blue-600" />,
      title: "Complete POS System",
      description: "Full-featured point-of-sale with product management, inventory tracking, and sales processing."
    },
    {
      icon: <Users className="h-8 w-8 text-green-600" />,
      title: "Customer Management",
      description: "Track customer information, purchase history, and build lasting relationships."
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-purple-600" />,
      title: "Sales Analytics",
      description: "Detailed reporting and analytics to understand your business performance."
    },
    {
      icon: <Shield className="h-8 w-8 text-red-600" />,
      title: "Secure & Reliable",
      description: "Built with security in mind featuring encrypted sessions and secure authentication."
    },
    {
      icon: <Smartphone className="h-8 w-8 text-orange-600" />,
      title: "Mobile Responsive",
      description: "Works perfectly on tablets, phones, and desktop computers."
    },
    {
      icon: <Zap className="h-8 w-8 text-yellow-600" />,
      title: "Fast & Efficient",
      description: "Lightning-fast performance with modern web technologies and optimized workflows."
    }
  ];

  const benefits = [
    "Real-time inventory management",
    "Multiple payment methods support",
    "Barcode scanning capability",
    "Receipt printing and digital receipts",
    "Tax calculation and reporting",
    "Coupon and discount management",
    "WooCommerce integration ready",
    "Offline capability for reliability"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Store className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">B-Plus POS</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <a href="https://github.com/anit3734/bplus-pos" target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4 mr-2" />
                  GitHub
                </a>
              </Button>
              <Button asChild>
                <Link href="/login">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Badge variant="outline" className="mb-4">
            <Clock className="h-3 w-3 mr-1" />
            Production Ready
          </Badge>
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
            Modern Point of Sale
            <span className="text-blue-600 block">for Your Business</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Complete, secure, and efficient POS system built with modern web technologies. 
            Manage your store, track inventory, process payments, and grow your business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-lg px-8">
              <Link href="/login">
                Start Using POS
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8">
              <Link href="/admin">
                Admin Panel
                <Settings className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Run Your Store
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From inventory management to customer relationships, our POS system handles it all.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="mb-4">{feature.icon}</div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Built for Modern Retail
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Our POS system combines powerful features with an intuitive interface, 
                making it easy for your team to serve customers efficiently.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:pl-8">
              <Card className="border-0 shadow-2xl">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl text-blue-600">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">99.9%</div>
                    <div className="text-gray-600">Uptime Reliability</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">&lt;100ms</div>
                    <div className="text-gray-600">Average Response Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">24/7</div>
                    <div className="text-gray-600">System Availability</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of businesses using our POS system to streamline operations and increase sales.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild className="text-lg px-8">
              <Link href="/login">
                Start Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 text-white border-white hover:bg-white hover:text-blue-600">
              <Globe className="mr-2 h-5 w-5" />
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Store className="h-6 w-6 text-blue-400" />
                <span className="text-xl font-bold">B-Plus POS</span>
              </div>
              <p className="text-gray-400">
                Modern point-of-sale system designed for efficiency, security, and growth.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link href="/login" className="block text-gray-400 hover:text-white transition-colors">
                  Login
                </Link>
                <Link href="/admin" className="block text-gray-400 hover:text-white transition-colors">
                  Admin Panel
                </Link>
                <Link href="/pos" className="block text-gray-400 hover:text-white transition-colors">
                  POS System
                </Link>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">System Info</h3>
              <div className="space-y-2 text-gray-400">
                <div>Default Login: admin/admin123</div>
                <div>Built with React & TypeScript</div>
                <div>PostgreSQL Database</div>
                <div>Railway Ready</div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 B-Plus POS. Built for modern retail businesses.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { MenuIcon, XIcon, HomeIcon, SparklesIcon } from "lucide-react";
import NexUsLogo from "../assets/NexUs.png";

export default function LandingLayout({ children, isLoading = false, showBreadcrumb = false, breadcrumbItems = [] }) {
  const [isHeaderLoaded, setIsHeaderLoaded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";

    const timer = setTimeout(() => setIsHeaderLoaded(true), 100);

    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
    };
    window.addEventListener('scroll', handleScroll);

    const revealItems = document.querySelectorAll(".reveal-on-scroll");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -25% 0px" }
    );

    revealItems.forEach((item) => observer.observe(item));

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
      document.documentElement.style.scrollBehavior = "";
    };
  }, []);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "#about", label: "About" },
    { href: "#features", label: "Features" },
    { href: "#blog", label: "Blog" },
    { href: "#faq", label: "FAQ" },
    { href: "#contact", label: "Contact" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900">

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
        <div className="h-14 w-full px-4 flex items-center transition-opacity duration-300">
          {!isHeaderLoaded ? (
            <>
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-xl" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <div className="ml-auto">
                <Skeleton className="h-9 w-20 rounded-lg" />
              </div>
            </>
          ) : (
            <>
              <Link to="/" className="flex items-center gap-3 group">
                <Avatar className="h-15 w-15 rounded-xl transition-transform duration-300 group-hover:scale-110">
                  <AvatarImage src={NexUsLogo} alt="NexUs logo" />
                  <AvatarFallback className="bg-gradient-to-br from-gray-900 to-gray-700 text-white font-semibold rounded-xl">
                    NX
                  </AvatarFallback>
                </Avatar>
                <div className="leading-tight">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 transition-colors group-hover:text-gray-700">
                      Tutoring
                    </span>
                 
                  </div>
                  <div className="text-xs text-gray-500">Platform</div>
                </div>
              </Link>

              {/* Desktop Navigation */}
              <nav className="ml-8 hidden items-center gap-6 text-sm text-gray-600 md:flex">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    className="relative py-1 transition-all duration-200 hover:text-gray-900 active:translate-y-0.5 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-gray-900 after:transition-all hover:after:w-full"
                    href={link.href}
                  >
                    {link.label}
                  </a>
                ))}
              </nav>

              {/* Mobile Menu Button */}
              <button
                className="ml-auto md:hidden p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 active:scale-95"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <XIcon className="h-5 w-5" />
                ) : (
                  <MenuIcon className="h-5 w-5" />
                )}
              </button>

              {/* Desktop Actions */}
              <div className="ml-auto hidden md:flex items-center gap-3">
                <Button asChild className="shadow-sm hover:shadow-md transition-shadow">
                  <Link to="/login">Sign In</Link>
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Scroll Progress Bar */}
        <Progress value={scrollProgress} className="h-0.5 rounded-none" />
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <ScrollArea className="md:hidden border-t border-gray-200 bg-white max-h-[calc(100vh-3.5rem)] animate-in slide-in-from-top-2 duration-200">
            <div className="px-4 py-3 space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                className="block py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Separator className="my-3" />
            
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
            </div>
          </ScrollArea>
        )}
      </header>

      {/* Breadcrumb Navigation */}
      {showBreadcrumb && breadcrumbItems.length > 0 && (
        <div className="border-b border-gray-200 bg-white">
          <div className="container mx-auto px-4 py-3">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/">
                      <HomeIcon className="h-4 w-4" />
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {breadcrumbItems.map((item, index) => (
                  <>
                    <BreadcrumbSeparator key={`sep-${index}`} />
                    <BreadcrumbItem key={index}>
                      {index === breadcrumbItems.length - 1 ? (
                        <BreadcrumbPage>{item.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link to={item.href}>{item.label}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="relative overflow-hidden animate-in fade-in duration-500">
        {/* Enhanced Background Decorations */}
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 opacity-60 blur-3xl" />
        <div className="absolute right-10 top-24 h-56 w-56 rounded-full border-2 border-gray-200/50 opacity-40" />
        <div className="absolute -left-16 bottom-16 h-40 w-40 rounded-full border-2 border-gray-200/50 opacity-40" />
        <div className="absolute left-1/4 top-1/3 h-32 w-32 rounded-full bg-gradient-to-br from-pink-100 to-orange-100 opacity-40 blur-2xl" />

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
              <Spinner className="h-8 w-8 text-gray-900" />
              <div className="space-y-2 text-center">
                <p className="text-sm text-gray-600 font-medium">Loading content...</p>
                <Progress value={33} className="w-48" />
              </div>
            </div>
          </div>
        )}

        {/* Content Container */}
        <div className="relative w-full">
          {children}
        </div>
      </main>

      {/* Optional: Loading State for Content */}
      {isLoading && (
        <div className="container mx-auto px-4 py-12 space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-12 w-3/4 mx-auto" />
            <Skeleton className="h-6 w-1/2 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4 p-6 border border-gray-200 rounded-xl bg-white shadow-sm">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-6 w-3/4" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
                <Separator />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-20 rounded-md" />
                  <Skeleton className="h-8 w-24 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LandingLayout from "../../layouts/LandingLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Sparkles, CalendarDays, User, Shield, Clock, Mail, 
  BarChart3, MessageSquare, Phone, MapPin, ArrowRight,
  CheckCircle2, Star, Users, BookOpen, TrendingUp, Zap
} from "lucide-react";
import { landingService } from "@/services/landingService";

import LandingHomeImg from "../../assets/LandingPage_Home.png";
import Blog1 from "../../assets/Blog_1.png";
import Blog2 from "../../assets/Blog_2.png";
import Blog3 from "../../assets/Blog_3.png";

const features = [
  { 
    icon: Clock, 
    title: "Easy Scheduling", 
    desc: "Quickly book and manage tutoring sessions with our intuitive calendar system.",
    color: "text-blue-600"
  },
  { 
    icon: Mail, 
    title: "Automated Reminders", 
    desc: "Never miss a session with automatic email and push notifications.",
    color: "text-purple-600"
  },
  { 
    icon: BarChart3, 
    title: "Track Progress", 
    desc: "Monitor learning progress with detailed analytics and session history.",
    color: "text-green-600"
  },
  { 
    icon: CalendarDays, 
    title: "Flexible Availability", 
    desc: "View tutor availability in real-time and pick the perfect time slot.",
    color: "text-orange-600"
  },
  { 
    icon: MessageSquare, 
    title: "Easy Communication", 
    desc: "Message tutors and parents seamlessly in one centralized platform.",
    color: "text-pink-600"
  },
  { 
    icon: Shield, 
    title: "Secure Access", 
    desc: "Enterprise-grade security with encrypted data and protected accounts.",
    color: "text-red-600"
  },
];

const defaultStats = [
  { value: "—", label: "Active Students", icon: Users },
  { value: "—", label: "Expert Tutors", icon: BookOpen },
  { value: "—", label: "Success Rate", icon: TrendingUp },
  { value: "24/7", label: "Support", icon: Zap },
];

const blogs = [
  { 
    img: Blog1, 
    title: "Tips for Better Studying", 
    desc: "Improve your study habits with simple techniques that work for any subject.",
    date: "Jan 15, 2026",
    readTime: "5 min read"
  },
  { 
    img: Blog2, 
    title: "How Scheduling Helps Students", 
    desc: "Consistent study time builds momentum and reduces missed sessions.",
    date: "Jan 10, 2026",
    readTime: "4 min read"
  },
  { 
    img: Blog3, 
    title: "Prepare for Exams Efficiently", 
    desc: "Use focused practice sessions and smart reminders to stay on track.",
    date: "Jan 5, 2026",
    readTime: "6 min read"
  },
];

const defaultTestimonials = [
  {
    name: "Sarah Johnson",
    role: "Student",
    avatar: "SJ",
    content: "This platform has transformed how my daughter approaches learning. The scheduling is seamless!",
    rating: 5
  },
  {
    name: "Michael Chen",
    role: "Student",
    avatar: "MC",
    content: "I love how easy it is to book sessions and track my progress. Highly recommend!",
    rating: 5
  },
  {
    name: "Emily Rodriguez",
    role: "Student",
    avatar: "ER",
    content: "Managing my schedule has never been easier. The automated reminders are a game-changer.",
    rating: 5
  },
];

const faqs = [
  { 
    q: "How do I book a tutoring session?", 
    a: "Simply sign up for an account, browse available tutors, and select a time slot that works for you. You'll receive instant confirmation and reminders before your session." 
  },
  { 
    q: "Is the system free to use?", 
    a: "Yes! The platform is completely free for students and parents. We believe quality education should be accessible to everyone." 
  },
  { 
    q: "Will I receive reminders for my sessions?", 
    a: "Absolutely. Email reminders are sent automatically 24 hours and 1 hour before each session to ensure you never miss a class." 
  },
  { 
    q: "Can I cancel or reschedule a session?", 
    a: "Yes, you can cancel or reschedule sessions as long as you do so before the cutoff time (typically 24 hours before the session)." 
  },
  { 
    q: "Do I need to install anything?", 
    a: "No installation required! Everything runs directly in your web browser. Just log in and start learning." 
  },
  { 
    q: "Are my personal details secure?", 
    a: "Yes. We use industry-standard encryption, secure authentication, and follow strict privacy policies to protect your data." 
  },
];

export default function Index() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(defaultStats);
  const [loadingStats, setLoadingStats] = useState(true);
  const [testimonials, setTestimonials] = useState(defaultTestimonials);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await landingService.getStats();
        if (res?.success && res.data) {
          const d = res.data;
          setStats([
            { value: d.totalStudents.toLocaleString(), label: "Active Students", icon: Users },
            { value: d.totalTutors.toLocaleString(), label: "Expert Tutors", icon: BookOpen },
            { value: `${d.successRate}%`, label: "Success Rate", icon: TrendingUp },
            { value: "24/7", label: "Support", icon: Zap },
          ]);
        }
      } catch {
        // keep defaults on error
      } finally {
        setLoadingStats(false);
      }
    };

    const fetchFeedbacks = async () => {
      try {
        const res = await landingService.getFeedbacks();
        if (res?.success && res.data?.length > 0) {
          setTestimonials(res.data.map((f) => {
            const names = f.customerName.split(" ");
            const initials = names.map((n) => n[0]).join("").toUpperCase().slice(0, 2);
            return {
              name: f.customerName,
              role: f.subjectName ? `Student — ${f.subjectName}` : "Student",
              avatar: initials,
              content: f.comment,
              rating: f.rating,
            };
          }));
        }
      } catch {
        // keep defaults on error
      } finally {
        setLoadingTestimonials(false);
      }
    };

    fetchStats();
    fetchFeedbacks();
  }, []);

  return (
    <LandingLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-gray-50 py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-grid-gray-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
        
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 reveal-on-scroll">
              <Badge variant="secondary" className="w-fit">
                <Sparkles className="h-3 w-3 mr-1" />
                Smart Tutoring Platform
              </Badge>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Easily manage tutoring schedules and book sessions online
              </h1>
              
              <p className="text-lg text-gray-600 max-w-2xl">
                Discover the best tutors, schedule sessions effortlessly, and receive automated reminders for a superior learning experience.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="group" onClick={() => navigate("/register")}>
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button size="lg" variant="outline">
                  Watch Demo
                </Button>
              </div>
              
              <div className="flex items-center gap-6 pt-4">
                {stats.slice(0, 2).map((stat) => (
                  <div key={stat.label} className="flex items-center gap-2">
                    <stat.icon className="h-5 w-5 text-gray-400" />
                    <div>
                      {loadingStats ? (
                        <Skeleton className="h-7 w-16 mb-1" />
                      ) : (
                        <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                      )}
                      <div className="text-sm text-gray-600">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative reveal-on-scroll">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl opacity-20 blur-2xl" />
              <Card className="relative border-2 shadow-xl overflow-hidden">
                <CardContent className="p-0">
                  <img 
                    src={LandingHomeImg} 
                    alt="Tutor and student illustration" 
                    className="w-full h-auto object-cover"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white border-y">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <Card key={stat.label} className="text-center border-none shadow-none reveal-on-scroll">
                <CardContent className="pt-6">
                  <stat.icon className="h-8 w-8 mx-auto text-gray-400 mb-3" />
                  {loadingStats ? (
                    <Skeleton className="h-9 w-20 mx-auto mb-1" />
                  ) : (
                    <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                  )}
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12 reveal-on-scroll">
            <Badge variant="outline" className="mb-4">
              <Sparkles className="h-3 w-3 mr-1" />
              About Us
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              About Smart Tutoring System
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              An all-in-one platform designed to make tutoring easier for students, teachers, and administrators.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="reveal-on-scroll">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <CalendarDays className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Our Purpose</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Provide students and parents with a simple and reliable way to access quality tutoring and stay organized.
                </p>
              </CardContent>
            </Card>

            <Card className="reveal-on-scroll">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Who We Serve</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-600">
                  {["Students", "Parents", "Teachers", "Schools & Learning Centers"].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="reveal-on-scroll">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Why We Built It</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-600">
                  {["Missed sessions", "Scheduling conflicts", "Hard-to-track progress", "Limited communication", "No visibility on availability"].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 bg-gray-400 rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12 reveal-on-scroll">
            <Badge variant="outline" className="mb-4">
              <Sparkles className="h-3 w-3 mr-1" />
              Features
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to succeed
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Powerful features designed to make tutoring management effortless and effective.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={feature.title} className="reveal-on-scroll hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className={`w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center mb-4 ${feature.color}`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section id="blog" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12 reveal-on-scroll">
            <Badge variant="outline" className="mb-4">
              <BookOpen className="h-3 w-3 mr-1" />
              Blog
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Latest Articles & Tips
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Discover helpful tips and insights to improve your learning experience
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {blogs.map((blog) => (
              <Card key={blog.title} className="reveal-on-scroll overflow-hidden group hover:shadow-xl transition-all">
                <div className="relative overflow-hidden">
                  <img 
                    src={blog.img} 
                    alt={blog.title} 
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-4 right-4">
                    <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm">
                      {blog.readTime}
                    </Badge>
                  </div>
                </div>
                <CardHeader>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <CalendarDays className="h-3 w-3" />
                    {blog.date}
                  </div>
                  <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">
                    {blog.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">{blog.desc}</p>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" className="w-full group/btn">
                    Read More
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="Testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12 reveal-on-scroll">
            <Badge variant="outline" className="mb-4">
              <Star className="h-3 w-3 mr-1" />
              Testimonials
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Loved by students, parents, and tutors
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {loadingTestimonials ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="reveal-on-scroll">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-3 w-24 mb-3" />
                    <Skeleton className="h-3 w-full mb-2" />
                    <Skeleton className="h-3 w-3/4" />
                  </CardContent>
                </Card>
              ))
            ) : (
              testimonials.map((testimonial, index) => (
                <Card key={index} className="reveal-on-scroll">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                          {testimonial.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">{testimonial.name}</CardTitle>
                        <CardDescription>{testimonial.role}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-1 mb-3">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-gray-600 text-sm">{testimonial.content}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12 reveal-on-scroll">
            <Badge variant="outline" className="mb-4">
              <MessageSquare className="h-3 w-3 mr-1" />
              FAQ
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need to know about our platform
            </p>
          </div>

          <Accordion type="single" collapsible className="reveal-on-scroll">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left font-semibold">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12 reveal-on-scroll">
            <Badge variant="outline" className="mb-4">
              <Phone className="h-3 w-3 mr-1" />
              Contact Us
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Get in touch
            </h2>
            <p className="text-lg text-gray-600">
              We're here to help with any questions you may have
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="reveal-on-scroll text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Email</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">support@smarttutoring.com</p>
              </CardContent>
            </Card>

            <Card className="reveal-on-scroll text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-lg">Phone</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">+63 900 000 0000</p>
              </CardContent>
            </Card>

            <Card className="reveal-on-scroll text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-lg">Facebook</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Smart Tutoring System</p>
              </CardContent>
            </Card>

            <Card className="reveal-on-scroll text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle className="text-lg">Location</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Manila, Philippines</p>
              </CardContent>
            </Card>
          </div>

          <Separator className="my-12" />

          <div className="text-center text-sm text-gray-500">
            © 2026 Smart Tutoring System. All rights reserved.
          </div>
        </div>
      </section>
    </LandingLayout>
  );
}

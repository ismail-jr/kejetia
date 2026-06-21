"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle,
  ArrowRight,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const CONTACT_INFO = [
  {
    icon: Mail,
    title: "Email Us",
    value: "support@uccconnect.edu",
    description: "We'll respond within 24 hours",
    action: "mailto:support@uccconnect.edu",
  },
  {
    icon: Phone,
    title: "Call Us",
    value: "+233 (0) 123 456 789",
    description: "Mon-Fri, 8:00 AM - 5:00 PM",
    action: "tel:+233123456789",
  },
  {
    icon: MapPin,
    title: "Visit Us",
    value: "University of Cape Coast",
    description: "Cape Coast, Ghana",
  },
];

const FAQS = [
  {
    question: "How do I create an account?",
    answer:
      "Click the 'Sign Up' button and register using your official UCC student email. You'll receive a verification link to complete your registration.",
  },
  {
    question: "Is Kejetia free to use?",
    answer:
      "Yes! Creating an account and browsing services is completely free. Service providers set their own prices.",
  },
  {
    question: "How do I book a service?",
    answer:
      "Browse services, click on a service you like, and use the 'Book Now' button. You'll be guided through the booking process.",
  },
  {
    question: "How do I become a provider?",
    answer:
      "Simply sign up, complete your profile, and click 'Offer a Service'. Your listing will be reviewed before going live.",
  },
];

// Shared animation variants matching the How It Works page
const headerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.25, delayChildren: 0.1 },
  },
};

const gridContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 18 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
};

const heroItemVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 18 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
};

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      toast.success("Message sent successfully! We'll get back to you soon.");
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
      setTimeout(() => setIsSubmitted(false), 5000);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-28 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
          <motion.div
            className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
            initial="hidden"
            animate="visible"
            variants={headerContainer}
          >
            <div className="text-center max-w-3xl mx-auto">
              <motion.div variants={heroItemVariants}>
                <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                  Contact Us
                </Badge>
              </motion.div>
              <motion.h1
                variants={heroItemVariants}
                className="text-4xl md:text-5xl font-heading text-foreground mb-4"
              >
                Get in Touch
              </motion.h1>
              <motion.p
                variants={heroItemVariants}
                className="text-lg text-muted-foreground leading-relaxed"
              >
                Have questions or need help? We'd love to hear from you. Reach
                out and we'll get back to you as soon as possible.
              </motion.p>
            </div>
          </motion.div>
        </section>

        {/* Contact Form & Info */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Contact Info Cards */}
              <motion.div
                className="space-y-4"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={gridContainer}
              >
                <motion.h2
                  variants={itemVariants}
                  className="text-2xl font-heading text-foreground mb-6"
                >
                  Get in Touch
                </motion.h2>
                {CONTACT_INFO.map((info, index) => {
                  const Icon = info.icon;
                  return (
                    <motion.div key={index} variants={itemVariants}>
                      <Card className="p-5 bg-card border-border hover:shadow-lg transition-all duration-300 group h-full">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground mb-0.5">
                              {info.title}
                            </h3>
                            {info.action ? (
                              <a
                                href={info.action}
                                className="text-primary hover:underline font-medium"
                              >
                                {info.value}
                              </a>
                            ) : (
                              <p className="text-foreground font-medium">
                                {info.value}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {info.description}
                            </p>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Contact Form */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={itemVariants}
              >
                <Card className="p-6 bg-card border-border">
                  <h2 className="text-2xl font-heading text-foreground mb-6">
                    Send a Message
                  </h2>
                  {isSubmitted ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      className="text-center py-8"
                    >
                      <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        Message Sent! 🎉
                      </h3>
                      <p className="text-muted-foreground">
                        Thank you for reaching out. We'll get back to you soon.
                      </p>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          placeholder="Your full name"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          required
                          className="rounded-xl"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@email.com"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          required
                          className="rounded-xl"
                        />
                      </div>
                      <div>
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                          id="subject"
                          placeholder="What's this about?"
                          value={formData.subject}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              subject: e.target.value,
                            })
                          }
                          required
                          className="rounded-xl"
                        />
                      </div>
                      <div>
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                          id="message"
                          placeholder="Tell us how we can help..."
                          rows={5}
                          value={formData.message}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              message: e.target.value,
                            })
                          }
                          required
                          className="rounded-xl resize-none"
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full rounded-xl gap-2"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            Send Message
                            <Send className="w-4 h-4" />
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center mb-12"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
              variants={headerContainer}
            >
              <motion.div variants={itemVariants}>
                <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                  FAQ
                </Badge>
              </motion.div>
              <motion.h2
                variants={itemVariants}
                className="text-3xl font-bold text-foreground mb-3"
              >
                Frequently Asked Questions
              </motion.h2>
              <motion.p
                variants={itemVariants}
                className="text-muted-foreground"
              >
                Quick answers to common questions
              </motion.p>
            </motion.div>

            {/* Each FAQ is now a Card wrapping a single AccordionItem, so the
                existing per-card entrance stagger (fade/scale-in as the
                section scrolls into view) is untouched — only the card's
                inner content became collapsible. type="single" + collapsible
                means exactly one panel is open at a time, and clicking the
                open one closes it. defaultValue opens the first FAQ on load. */}
            <motion.div
              className="space-y-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={gridContainer}
            >
              <Accordion
                type="single"
                collapsible
                defaultValue="faq-0"
                className="space-y-4"
              >
                {FAQS.map((faq, index) => (
                  <motion.div key={index} variants={itemVariants}>
                    <Card className="bg-card border-border hover:shadow-md transition-all overflow-hidden">
                      <AccordionItem
                        value={`faq-${index}`}
                        className="border-none"
                      >
                        <AccordionTrigger className="px-6 py-4 text-left font-semibold text-foreground hover:no-underline [&>svg]:text-primary">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-4 text-sm text-muted-foreground leading-relaxed">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    </Card>
                  </motion.div>
                ))}
              </Accordion>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <motion.div
            className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={headerContainer}
          >
            <motion.h2
              variants={itemVariants}
              className="text-3xl font-bold text-foreground mb-4"
            >
              Still have questions?
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-muted-foreground mb-8 max-w-xl mx-auto"
            >
              Check out our help center or reach out to us directly for
              personalized support.
            </motion.p>
            <motion.div variants={itemVariants}>
              <Button asChild variant="outline" className="rounded-xl gap-2">
                <Link href="/help">
                  Visit Help Center
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

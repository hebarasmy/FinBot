"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, FileText, Download, Mail, Phone, MapPin, Shield, AlertCircle, ChevronDown, ChevronUp, X, UserCheck, FileTerminal, Cookie } from 'lucide-react'
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"

export default function PrivacyPolicyPage() {
  const router = useRouter()
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [expandedRights, setExpandedRights] = useState<string | null>(null)
  const [showEmailMessage, setShowEmailMessage] = useState(false)
  const [showDpoMessage, setShowDpoMessage] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  const toggleRights = (id: string) => {
    if (expandedRights === id) {
      setExpandedRights(null)
    } else {
      setExpandedRights(id)
    }
  }

  // Function to download document content
  const handleDownloadDoc = (docId: string, title: string) => {
    setIsGeneratingPdf(true)
    
    try {
      const doc = policyDocuments.find(d => d.id === docId)
      if (!doc) {
        throw new Error("Document not found")
      }
      
      let content = `Fin-Bot - ${title}\n`
      content += `Generated on: ${new Date().toLocaleDateString()}\n\n`
      content += `${doc.description}\n\n`
      
      if (docId === "terms-of-service") {
        content += `TERMS OF SERVICE\n\n`
        content += `By accessing or using the Fin-Bot service, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the service.\n\n`
        content += `We reserve the right to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.\n\n`
        content += `USER RESPONSIBILITIES\n`
        content += `When using our services, you agree to:\n`
        content += `- Provide accurate and complete information\n`
        content += `- Maintain the security of your account credentials\n`
        content += `- Use our services in compliance with applicable laws and regulations\n`
        content += `- Respect the privacy and rights of other users\n\n`
        content += `LIMITATION OF LIABILITY\n`
        content += `Fin-Bot shall not be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service.\n\n`
        content += `GOVERNING LAW\n`
        content += `These Terms shall be governed and construed in accordance with the laws applicable in the United Arab Emirates, without regard to its conflict of law provisions.\n`
      } else if (docId === "privacy-policy") {
        content += `PRIVACY POLICY\n\n`
        content += `Your privacy is important to us. It is Fin-Bot's policy to respect your privacy regarding any information we may collect from you across our website and other sites we own and operate.\n\n`
        content += `We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent.\n\n`
        content += `WHAT DATA DO WE COLLECT?\n`
        content += `Fin-Bot collects the following data:\n`
        content += `- Personal identification information (Name, email address, phone number, etc.)\n`
        content += `- Financial information for processing payments\n`
        content += `- Usage data and analytics\n`
        content += `- Device and browser information\n\n`
        content += `HOW DO WE USE YOUR DATA?\n`
        content += `Fin-Bot collects your data so that we can:\n`
        content += `- Process your orders and manage your account\n`
        content += `- Provide and maintain our service\n`
        content += `- Improve our services and user experience\n`
        content += `- Communicate with you about service-related issues\n`
        content += `- Comply with legal obligations\n\n`
        content += `HOW DO WE STORE YOUR DATA?\n`
        content += `Fin-Bot securely stores your data using industry-standard encryption and security measures. Your data is stored on secure servers with appropriate safeguards.\n\n`
        content += `YOUR DATA PROTECTION RIGHTS\n`
        content += `You have the right to:\n`
        content += `- Access the personal data we hold about you\n`
        content += `- Request correction of inaccurate information\n`
        content += `- Request deletion of your data under certain conditions\n`
        content += `- Object to our processing of your data under certain conditions\n`
        content += `- Request that we transfer your data to another organization or directly to you\n`
      } else if (docId === "cookie-policy") {
        content += `COOKIE POLICY\n\n`
        content += `We use cookies to store information about your preferences and to track your usage of our website. This helps us customize and improve your experience with us.\n\n`
        content += `You can choose to disable cookies through your browser options, but this may prevent you from taking full advantage of the website.\n\n`
        content += `WHAT ARE COOKIES?\n`
        content += `Cookies are small text files placed on your computer to collect standard Internet log information and visitor behavior information. When you visit our website, we may collect information from you automatically through cookies or similar technology.\n\n`
        content += `HOW DO WE USE COOKIES?\n`
        content += `Fin-Bot uses cookies in a range of ways to improve your experience on our website, including:\n`
        content += `- Keeping you signed in\n`
        content += `- Understanding how you use our website\n`
        content += `- Personalizing your experience\n`
        content += `- Improving website performance and functionality\n\n`
        content += `WHAT TYPES OF COOKIES DO WE USE?\n`
        content += `There are a number of different types of cookies, however, our website uses:\n`
        content += `- Necessary cookies: Essential for the website to function properly\n`
        content += `- Functionality cookies: Remember your preferences and settings\n`
        content += `- Performance cookies: Collect information about how you use our website\n`
        content += `- Advertising cookies: Used to deliver relevant advertisements and track campaign performance\n\n`
        content += `HOW TO MANAGE COOKIES\n`
        content += `You can set your browser not to accept cookies. However, some of our website features may not function as a result.\n`
      } else if (docId === "gdpr-compliance") {
        content += `GDPR COMPLIANCE\n\n`
        content += `This statement outlines how we comply with the General Data Protection Regulation (GDPR) and protect your data rights.\n\n`
        content += `WHAT ARE YOUR DATA PROTECTION RIGHTS?\n`
        content += `Under GDPR, you have the following rights:\n\n`
        content += `THE RIGHT TO ACCESS\n`
        content += `You have the right to request copies of your personal data from Fin-Bot. We may charge a small fee for this service.\n\n`
        content += `THE RIGHT TO RECTIFICATION\n`
        content += `You have the right to request that Fin-Bot correct any information you believe is inaccurate or incomplete.\n\n`
        content += `THE RIGHT TO ERASURE\n`
        content += `You have the right to request that Fin-Bot erase your personal data, under certain conditions.\n\n`
        content += `THE RIGHT TO RESTRICT PROCESSING\n`
        content += `You have the right to request that Fin-Bot restrict the processing of your personal data, under certain conditions.\n\n`
        content += `THE RIGHT TO OBJECT TO PROCESSING\n`
        content += `You have the right to object to Fin-Bot's processing of your personal data, under certain conditions.\n\n`
        content += `THE RIGHT TO DATA PORTABILITY\n`
        content += `You have the right to request that Fin-Bot transfer the data that we have collected to another organization, or directly to you, under certain conditions.\n\n`
        content += `If you make a request, we have one month to respond to you. If you would like to exercise any of these rights, please contact us using the information provided in the "How to contact us" section.\n`
      }
      
      content += `\n\nContact us: finb0t@outlook.com | +971501234567\n`
      content += `University of Birmingham Dubai, Academic City\n`
      
      const blob = new Blob([content], { type: "text/plain" })
      
      const url = window.URL.createObjectURL(blob)
      
      const a = document.createElement("a")
      a.href = url
      a.download = `finbot-${title.toLowerCase().replace(/\s+/g, "-")}.txt`
      
      document.body.appendChild(a)
      
      a.click()
      
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error generating document:", error)
      alert("There was an error generating the document. Please try again.")
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const policyDocuments = [
    {
      id: "terms-of-service",
      title: "Terms of Service",
      description: "Terms and conditions for using our service",
      fileType: "PDF",
      icon: <FileTerminal className="h-5 w-5 mr-3 text-blue-600" />,
      content: (
        <div className="space-y-4">
          <p>
            By accessing or using the Fin-Bot service, you agree to be bound by these Terms. If you disagree with any
            part of the terms, you may not access the service.
          </p>

          <p>
            We reserve the right to modify or replace these Terms at any time. If a revision is material, we will try to
            provide at least 30 days notice prior to any new terms taking effect.
          </p>

          <h3 className="text-lg font-medium mt-4">User Responsibilities</h3>
          <p>When using our services, you agree to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Provide accurate and complete information</li>
            <li>Maintain the security of your account credentials</li>
            <li>Use our services in compliance with applicable laws and regulations</li>
            <li>Respect the privacy and rights of other users</li>
          </ul>

          <h3 className="text-lg font-medium mt-4">Limitation of Liability</h3>
          <p>
            Fin-Bot shall not be liable for any indirect, incidental, special, consequential or punitive damages,
            including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting
            from your access to or use of or inability to access or use the service.
          </p>

          <h3 className="text-lg font-medium mt-4">Governing Law</h3>
          <p>
            These Terms shall be governed and construed in accordance with the laws applicable in the United Arab
            Emirates, without regard to its conflict of law provisions.
          </p>
        </div>
      ),
    },
    {
      id: "privacy-policy",
      title: "Privacy Policy",
      description: "How we collect, use, and protect your data",
      fileType: "PDF",
      icon: <Shield className="h-5 w-5 mr-3 text-blue-600" />,
      content: (
        <div className="space-y-4">
          <p>
            Your privacy is important to us. It is Fin-Bots policy to respect your privacy regarding any information we
            may collect from you across our website and other sites we own and operate.
          </p>

          <p>
            We only ask for personal information when we truly need it to provide a service to you. We collect it by
            fair and lawful means, with your knowledge and consent.
          </p>

          <h3 className="text-lg font-medium mt-4">What data do we collect?</h3>
          <p>Fin-Bot collects the following data:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Personal identification information (Name, email address, phone number, etc.)</li>
            <li>Financial information for processing payments</li>
            <li>Usage data and analytics</li>
            <li>Device and browser information</li>
          </ul>

          <h3 className="text-lg font-medium mt-4">How do we use your data?</h3>
          <p>Fin-Bot collects your data so that we can:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Process your orders and manage your account</li>
            <li>Provide and maintain our service</li>
            <li>Improve our services and user experience</li>
            <li>Communicate with you about service-related issues</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h3 className="text-lg font-medium mt-4">How do we store your data?</h3>
          <p>
            Fin-Bot securely stores your data using industry-standard encryption and security measures. Your data is
            stored on secure servers with appropriate safeguards.
          </p>

          <h3 className="text-lg font-medium mt-4">Your Data Protection Rights</h3>
          <p>You have the right to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your data under certain conditions</li>
            <li>Object to our processing of your data under certain conditions</li>
            <li>Request that we transfer your data to another organization or directly to you</li>
          </ul>
        </div>
      ),
    },
    {
      id: "cookie-policy",
      title: "Cookie Policy",
      description: "Information about cookies and tracking technologies",
      fileType: "PDF",
      icon: <Cookie className="h-5 w-5 mr-3 text-blue-600" />,
      content: (
        <div className="space-y-4">
          <p>
            We use cookies to store information about your preferences and to track your usage of our website. This
            helps us customize and improve your experience with us.
          </p>

          <p>
            You can choose to disable cookies through your browser options, but this may prevent you from taking full
            advantage of the website.
          </p>

          <h3 className="text-lg font-medium mt-4">What are cookies?</h3>
          <p>
            Cookies are small text files placed on your computer to collect standard Internet log information and
            visitor behavior information. When you visit our website, we may collect information from you automatically
            through cookies or similar technology.
          </p>

          <h3 className="text-lg font-medium mt-4">How do we use cookies?</h3>
          <p>Fin-Bot uses cookies in a range of ways to improve your experience on our website, including:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Keeping you signed in</li>
            <li>Understanding how you use our website</li>
            <li>Personalizing your experience</li>
            <li>Improving website performance and functionality</li>
          </ul>

          <h3 className="text-lg font-medium mt-4">What types of cookies do we use?</h3>
          <p>There are a number of different types of cookies, however, our website uses:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Necessary cookies:</strong> Essential for the website to function properly
            </li>
            <li>
              <strong>Functionality cookies:</strong> Remember your preferences and settings
            </li>
            <li>
              <strong>Performance cookies:</strong> Collect information about how you use our website
            </li>
            <li>
              <strong>Advertising cookies:</strong> Used to deliver relevant advertisements and track campaign
              performance
            </li>
          </ul>

          <h3 className="text-lg font-medium mt-4">How to manage cookies</h3>
          <p>
            You can set your browser not to accept cookies. However, some of our website features may not function as a
            result.
          </p>
        </div>
      ),
    },
    {
      id: "gdpr-compliance",
      title: "GDPR Compliance",
      description: "Our compliance with EU data protection regulations",
      fileType: "PDF",
      icon: <FileText className="h-5 w-5 mr-3 text-blue-600" />,
      content: (
        <div className="space-y-4">
          <p>
            This statement outlines how we comply with the General Data Protection Regulation (GDPR) and protect your
            data rights.
          </p>

          <h3 className="text-lg font-medium mt-4">What are your data protection rights?</h3>
          <p>Under GDPR, you have the following rights:</p>

          <div className="mt-4 space-y-2">
            {[
              {
                id: "access",
                title: "The right to access",
                content:
                  "You have the right to request copies of your personal data from Fin-Bot. We may charge a small fee for this service.",
              },
              {
                id: "rectification",
                title: "The right to rectification",
                content:
                  "You have the right to request that Fin-Bot correct any information you believe is inaccurate or incomplete.",
              },
              {
                id: "erasure",
                title: "The right to erasure",
                content:
                  "You have the right to request that Fin-Bot erase your personal data, under certain conditions.",
              },
              {
                id: "restrict",
                title: "The right to restrict processing",
                content:
                  "You have the right to request that Fin-Bot restrict the processing of your personal data, under certain conditions.",
              },
              {
                id: "object",
                title: "The right to object to processing",
                content:
                  "You have the right to object to Fin-Bot's processing of your personal data, under certain conditions.",
              },
              {
                id: "portability",
                title: "The right to data portability",
                content:
                  "You have the right to request that Fin-Bot transfer the data that we have collected to another organization, or directly to you, under certain conditions.",
              },
            ].map((right) => (
              <div key={right.id} className="border rounded-md overflow-hidden">
                <button
                  className="flex justify-between items-center w-full p-3 text-left font-medium bg-gray-50 hover:bg-gray-100 transition-colors"
                  onClick={() => toggleRights(right.id)}
                >
                  {right.title}
                  <span>
                    {expandedRights === right.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </span>
                </button>
                {expandedRights === right.id && <div className="p-3 border-t">{right.content}</div>}
              </div>
            ))}
          </div>

          <p className="mt-4">
            If you make a request, we have one month to respond to you. If you would like to exercise any of these
            rights, please contact us using the information provided in the -How to contact us- section.
          </p>
        </div>
      ),
    },
  ]

  const toggleSection = (id: string) => {
    if (expandedSection === id) {
      setExpandedSection(null)
    } else {
      setExpandedSection(id)
    }
  }

  return (
    <div className="container py-8 h-screen overflow-auto">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Profile
        </Button>
        <h1 className="text-2xl font-bold">Terms, Privacy Policy and Cookies Policy</h1>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <Shield className="h-5 w-5 text-blue-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              Your privacy is important to us. This page contains all our legal documents. Please review them carefully
              to understand how we collect, use, and protect your data.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {policyDocuments.map((doc) => (
          <Card key={doc.id} className="overflow-hidden">
            <CardHeader className="p-4 cursor-pointer" onClick={() => toggleSection(doc.id)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {doc.icon}
                  <CardTitle className="text-lg">{doc.title}</CardTitle>
                </div>
              </div>
            </CardHeader>
            {expandedSection === doc.id && (
              <CardContent className="p-4 pt-0 border-t">
                <p className="text-gray-600 mb-4">{doc.description}</p>

                <div className="my-4 bg-gray-50 p-4 rounded-lg max-h-[400px] overflow-y-auto">
                  {doc.content}
                </div>

                <div className="flex justify-end items-center mt-4">
                  <Button
                    className="flex items-center"
                    onClick={() => handleDownloadDoc(doc.id, doc.title)}
                    disabled={isGeneratingPdf}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {isGeneratingPdf ? "Generating Document..." : "Download Document"}
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">How to Contact Us</h2>
        <p className="text-gray-600 mb-6">
          If you have any questions about our privacy policies or how we handle your data, please contact our Data
          Protection Officer using any of the methods below.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="flex items-start">
            <Mail className="h-5 w-5 mr-3 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium mb-1">Email Us</h3>
              <p className="text-gray-600">finb0t@outlook.com</p>
            </div>
          </div>

          <div className="flex items-start">
            <Phone className="h-5 w-5 mr-3 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium mb-1">Call Us</h3>
              <p className="text-gray-600">+971501234567</p>
            </div>
          </div>

          <div className="flex items-start">
            <MapPin className="h-5 w-5 mr-3 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium mb-1">Visit Us</h3>
              <p className="text-gray-600">University of Birmingham Dubai, Academic City</p>
            </div>
          </div>
        </div>

        <div className="flex items-start mb-6">
          <AlertCircle className="h-5 w-5 mr-3 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium mb-1">Contact the Appropriate Authority</h3>
            <p className="text-gray-600">
              Should you wish to report a complaint or if you feel that we have not addressed your concern
              satisfactorily, you may contact the relevant data protection authority.
            </p>
          </div>
        </div>

        <div className="flex space-x-4">
          <Button variant="outline" onClick={() => setShowDpoMessage(true)}>
            Contact DPO
          </Button>
          <Button onClick={() => setShowEmailMessage(true)}>Submit a Request</Button>
        </div>
      </div>

      {/* Email Message Modal */}
      {showEmailMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4 relative">
            <button
              onClick={() => setShowEmailMessage(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center mb-4">
              <Mail className="h-12 w-12 text-blue-600 mx-auto mb-2" />
              <h3 className="text-xl font-semibold">Email Us</h3>
            </div>

            <p className="text-gray-600 mb-4 text-center">Please email us with your inquiries at:</p>

            <div className="bg-blue-50 p-3 rounded-md text-center mb-4">
              <p className="text-blue-700 font-medium">finb0t@outlook.com</p>
            </div>

            <p className="text-sm text-gray-500 mb-4 text-center">
              We aim to respond to all inquiries within 2 business days.
            </p>

            <div className="flex justify-center">
              <Button
                onClick={() => {
                  // Copy email to clipboard
                  navigator.clipboard.writeText("finb0t@outlook.com")
                  alert("Email copied to clipboard!")
                }}
                className="mr-2"
              >
                Copy Email
              </Button>
              <Button variant="outline" onClick={() => setShowEmailMessage(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DPO Message Modal */}
      {showDpoMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4 relative">
            <button
              onClick={() => setShowDpoMessage(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center mb-4">
              <UserCheck className="h-12 w-12 text-blue-600 mx-auto mb-2" />
              <h3 className="text-xl font-semibold">Contact Data Protection Officer</h3>
            </div>

            <p className="text-gray-600 mb-4 text-center">
              For data protection inquiries or to exercise your privacy rights, please contact our Data Protection
              Officer at:
            </p>

            <div className="bg-blue-50 p-3 rounded-md text-center mb-4">
              <p className="text-blue-700 font-medium">finb0t@outlook.com</p>
            </div>

            <p className="text-sm text-gray-500 mb-4 text-center">
              Our DPO will respond to your request within 30 days as required by GDPR.
            </p>

            <div className="flex justify-center">
              <Button
                onClick={() => {
                  // Copy email to clipboard
                  navigator.clipboard.writeText("finb0t@outlook.com")
                  alert("Email copied to clipboard!")
                }}
                className="mr-2"
              >
                Copy Email
              </Button>
              <Button variant="outline" onClick={() => setShowDpoMessage(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
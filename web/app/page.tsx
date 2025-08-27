'use client'

import Link from 'next/link'
import { Button } from '@/components/Button'
import { useEffect, useState } from 'react'
import { 
  HardHatIcon,
  IBeamCraneIcon,
  WeldingTorchIcon,
  MediaGalleryIcon,
  IronworkersTeamIcon,
  ProjectDrawingsIcon,
  SparkAnimationIcon,
  CraneHookAnimationIcon
} from '@/components/icons/SteelConstructionIcons'
import { Shield, Clock, Cloud, CheckCircle, ArrowRight } from 'lucide-react'

export default function HomePage() {
  const [showSparks, setShowSparks] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setShowSparks(true)
      setTimeout(() => setShowSparks(false), 3000)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  const features = [
    {
      icon: MediaGalleryIcon,
      title: 'Media Documentation',
      description: 'Capture and organize photos & videos of construction progress with location tagging.'
    },
    {
      icon: Shield,
      title: 'Safety Compliance',
      description: 'OSHA-compliant documentation with real-time incident reporting and tracking.'
    },
    {
      icon: IronworkersTeamIcon,
      title: 'Team Management',
      description: 'Track worker activities, certifications, and union status in one place.'
    },
    {
      icon: ProjectDrawingsIcon,
      title: 'Project Tracking',
      description: 'Monitor multiple construction projects with timeline views and progress reports.'
    },
    {
      icon: Clock,
      title: 'Real-time Updates',
      description: 'Instant notifications and live progress updates from the field.'
    },
    {
      icon: Cloud,
      title: 'Cloud Storage',
      description: 'Secure cloud backup with offline capabilities for job site use.'
    }
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0a0a' }}>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 diamond-plate opacity-10" />
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 animate-lift opacity-20">
            <IBeamCraneIcon className="h-64 w-64 text-safety-orange" size={256} />
          </div>
          <div className="absolute bottom-20 right-10 animate-tighten opacity-20">
            <WeldingTorchIcon className="h-48 w-48 text-arc-flash-yellow" size={192} />
          </div>
          {showSparks && (
            <>
              <SparkAnimationIcon 
                className="absolute top-1/3 right-1/4 h-24 w-24 text-arc-flash-yellow animate-spark" 
              />
              <SparkAnimationIcon 
                className="absolute bottom-1/2 left-1/3 h-16 w-16 text-safety-orange animate-spark" 
              />
            </>
          )}
        </div>

        {/* Hero content */}
        <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-7xl mx-auto text-center">
            <div className="flex justify-center mb-8">
              <HardHatIcon className="h-24 w-24 text-arc-flash-yellow arc-weld-glow rounded-full" size={96} />
            </div>
            <h1 className="text-5xl lg:text-7xl font-shogun text-white mb-6">
              Iron Task
            </h1>
            <p className="text-xl lg:text-2xl text-gray-300 mb-4">
              Professional Construction Documentation System
            </p>
            <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
              Built by ironworkers, for ironworkers. Document your projects, ensure safety compliance, 
              and track progress with the most trusted platform in steel construction.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/demo">
                <Button size="lg" className="bg-safety-orange hover:bg-orange-700 text-white font-bold px-8 py-4 text-lg arc-weld-glow">
                  <Shield className="h-5 w-5 mr-2" />
                  Try Interactive Demo
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" size="lg" className="border-gray-400 bg-white text-black hover:bg-gray-100 hover:text-black hover:border-gray-300 px-8 py-4 text-lg">
                  Start Free Trial
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-shogun text-white mb-4">Built for Steel Construction</h2>
            <p className="text-lg text-gray-400">Everything you need to document and manage construction projects</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="brushed-metal rounded-lg p-6 hover:shadow-[0_0_20px_rgba(0,114,206,0.5)] transition-all duration-300">
                <feature.icon className="h-12 w-12 text-safety-orange mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Security & Compliance Section */}
      <div className="relative py-16 bg-gray-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-shogun text-white mb-4">Enterprise-Grade Security</h2>
            <p className="text-lg text-gray-400">Your construction data is protected with industry-leading security standards</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* SOC 2 Compliance */}
            <div className="text-center">
              <div className="w-16 h-16 bg-safety-green rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">SOC 2 Compliant</h3>
              <p className="text-gray-400 text-sm">Independently audited security controls</p>
            </div>

            {/* Data Encryption */}
            <div className="text-center">
              <div className="w-16 h-16 bg-aisc-blue rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">256-bit Encryption</h3>
              <p className="text-gray-400 text-sm">Data encrypted in transit and at rest</p>
            </div>

            {/* OSHA Compliance */}
            <div className="text-center">
              <div className="w-16 h-16 bg-safety-orange rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">OSHA Ready</h3>
              <p className="text-gray-400 text-sm">Built-in compliance reporting tools</p>
            </div>

            {/* Backup & Recovery */}
            <div className="text-center">
              <div className="w-16 h-16 bg-arc-flash-yellow rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Daily Backups</h3>
              <p className="text-gray-400 text-sm">Automated backups with 99.9% uptime</p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-4 bg-gray-800/50 rounded-lg px-6 py-4">
              <Shield className="h-6 w-6 text-safety-green" />
              <div className="text-left">
                <p className="text-white font-semibold">GDPR & CCPA Compliant</p>
                <p className="text-gray-400 text-sm">Your privacy rights are protected</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Demo Section */}
      <div className="relative py-24 bg-gradient-to-b from-transparent to-gray-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-shogun text-white mb-4">See Iron Task in Action</h2>
            <p className="text-lg text-gray-400">Experience the power of professional construction documentation</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Demo Video/Screenshot */}
            <div className="relative">
              <div className="brushed-metal rounded-lg p-4 shadow-2xl">
                <div className="bg-gray-800 rounded-lg overflow-hidden">
                  {/* Placeholder for demo video or screenshot */}
                  <div className="aspect-video bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center relative">
                    <div className="text-center">
                      <div className="mb-4">
                        <svg className="h-16 w-16 text-safety-orange mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">Interactive Demo Coming Soon</h3>
                      <p className="text-gray-400 text-sm">See how Iron Task streamlines your documentation workflow</p>
                    </div>
                    {/* Play button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button className="bg-safety-orange hover:bg-orange-700 rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110">
                        <svg className="h-8 w-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-safety-orange rounded-lg flex items-center justify-center">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Instant Photo Documentation</h3>
                  <p className="text-gray-400">Capture and organize construction photos with automatic location tagging and progress tracking.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-aisc-blue rounded-lg flex items-center justify-center">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Real-time Analytics</h3>
                  <p className="text-gray-400">Track project progress with detailed analytics and automated reporting for stakeholders.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-arc-flash-yellow rounded-lg flex items-center justify-center">
                    <svg className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Team Collaboration</h3>
                  <p className="text-gray-400">Keep your entire crew connected with real-time updates and seamless communication tools.</p>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <Link href="/demo">
                  <Button size="lg" className="bg-safety-orange hover:bg-orange-700 text-white">
                    Try Interactive Demo
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
                <p className="text-gray-400 text-sm">No registration required • See it in action</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="relative py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-shogun text-white mb-4">Simple, Transparent Pricing</h2>
            <p className="text-lg text-gray-400">Choose the plan that fits your construction team</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter Plan */}
            <div className="brushed-metal rounded-lg p-8 relative">
              <div className="text-center">
                <h3 className="text-2xl font-shogun text-white mb-4">Starter</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-safety-orange">$29</span>
                  <span className="text-gray-400">/month</span>
                </div>
                <ul className="space-y-3 text-gray-300 mb-8">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-safety-green" />
                    <span>Up to 5 team members</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-safety-green" />
                    <span>1GB photo/video storage</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-safety-green" />
                    <span>Basic project tracking</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-safety-green" />
                    <span>Email support</span>
                  </li>
                </ul>
                <Button className="w-full bg-gray-700 hover:bg-gray-600 text-white">Get Started</Button>
              </div>
            </div>

            {/* Professional Plan */}
            <div className="brushed-metal rounded-lg p-8 relative border-2 border-safety-orange">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-safety-orange text-black px-4 py-1 rounded-full text-sm font-bold">Most Popular</span>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-shogun text-white mb-4">Professional</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-safety-orange">$79</span>
                  <span className="text-gray-400">/month</span>
                </div>
                <ul className="space-y-3 text-gray-300 mb-8">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-safety-green" />
                    <span>Up to 25 team members</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-safety-green" />
                    <span>10GB photo/video storage</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-safety-green" />
                    <span>Advanced project analytics</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-safety-green" />
                    <span>Priority phone support</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-safety-green" />
                    <span>Custom reporting</span>
                  </li>
                </ul>
                <Button className="w-full bg-safety-orange hover:bg-orange-700 text-white">Get Started</Button>
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className="brushed-metal rounded-lg p-8 relative">
              <div className="text-center">
                <h3 className="text-2xl font-shogun text-white mb-4">Enterprise</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-safety-orange">Custom</span>
                </div>
                <ul className="space-y-3 text-gray-300 mb-8">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-safety-green" />
                    <span>Unlimited team members</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-safety-green" />
                    <span>Unlimited storage</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-safety-green" />
                    <span>Custom integrations</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-safety-green" />
                    <span>Dedicated account manager</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-safety-green" />
                    <span>On-site training</span>
                  </li>
                </ul>
                <Button className="w-full bg-aisc-blue hover:bg-blue-700 text-white">Contact Sales</Button>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-400 mb-4">All plans include 30-day free trial • No setup fees • Cancel anytime</p>
            <p className="text-gray-500 text-sm">Need something different? <Link href="/contact" className="text-safety-orange hover:text-orange-400">Contact us</Link> for custom pricing.</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative py-24">
        <hr className="weld-seam max-w-4xl mx-auto mb-24" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <CraneHookAnimationIcon className="h-20 w-20 text-aisc-blue mx-auto mb-8 animate-lift" size={80} />
          <h2 className="text-3xl font-shogun text-white mb-6">
            Ready to Transform Your Documentation?
          </h2>
          <p className="text-lg text-gray-400 mb-8">
            Join over 50+ construction companies already using Iron Task
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <div className="flex items-center gap-2 text-gray-400">
              <CheckCircle className="h-5 w-5 text-safety-green" />
              <span>Free 30-day trial</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <CheckCircle className="h-5 w-5 text-safety-green" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <CheckCircle className="h-5 w-5 text-safety-green" />
              <span>Full feature access</span>
            </div>
          </div>
          <div className="mt-12 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/demo">
                <Button size="lg" className="bg-safety-orange hover:bg-orange-700 text-white font-bold px-8 py-4 text-lg arc-weld-glow">
                  Try Demo First
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" className="bg-aisc-blue hover:bg-blue-700 text-white font-bold px-8 py-4 text-lg">
                  Start Free Trial
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>
            <p className="text-gray-400 text-sm">No credit card required for demo or trial</p>
          </div>
        </div>
      </div>

      {/* Mobile App Section */}
      <div className="relative py-20 bg-gradient-to-r from-gray-900 to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div>
              <h2 className="text-4xl font-shogun text-white mb-6">Take Iron Task to the Field</h2>
              <p className="text-xl text-gray-300 mb-6">
                Document projects on-site with our mobile app built specifically for construction workers.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-safety-green flex-shrink-0" />
                  <span className="text-gray-300">Offline mode - works without internet</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-safety-green flex-shrink-0" />
                  <span className="text-gray-300">Auto GPS tagging for exact locations</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-safety-green flex-shrink-0" />
                  <span className="text-gray-300">Voice notes and quick annotations</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-safety-green flex-shrink-0" />
                  <span className="text-gray-300">Instant sync when back online</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                {/* App Store Button */}
                <div className="bg-black rounded-lg px-6 py-3 flex items-center gap-3 hover:bg-gray-900 transition-colors cursor-pointer">
                  <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <div className="text-left">
                    <p className="text-gray-400 text-xs">Download on the</p>
                    <p className="text-white font-semibold">App Store</p>
                  </div>
                </div>

                {/* Google Play Button */}
                <div className="bg-black rounded-lg px-6 py-3 flex items-center gap-3 hover:bg-gray-900 transition-colors cursor-pointer">
                  <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                  </svg>
                  <div className="text-left">
                    <p className="text-gray-400 text-xs">Get it on</p>
                    <p className="text-white font-semibold">Google Play</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
                <p className="text-gray-300 text-sm">
                  <span className="font-semibold text-arc-flash-yellow">Coming Soon:</span> Scan this QR code with your phone to get notified when the mobile app launches.
                </p>
              </div>
            </div>

            {/* Phone Mockup */}
            <div className="relative">
              <div className="mx-auto w-64 h-[32rem] bg-gray-900 rounded-3xl p-4 shadow-2xl">
                <div className="w-full h-full bg-gray-800 rounded-2xl overflow-hidden relative">
                  {/* Phone screen content */}
                  <div className="bg-gradient-to-b from-gray-700 to-gray-900 h-full flex flex-col items-center justify-center">
                    <div className="text-center">  
                      <HardHatIcon className="h-16 w-16 text-arc-flash-yellow mx-auto mb-4" />
                      <h3 className="text-white font-shogun text-lg mb-2">Iron Task Mobile</h3>
                      <p className="text-gray-400 text-sm px-6">Field-ready construction documentation</p>
                      
                      <div className="mt-8 space-y-3">
                        <div className="w-32 h-2 bg-safety-orange rounded mx-auto"></div>
                        <div className="w-24 h-2 bg-gray-600 rounded mx-auto"></div>
                        <div className="w-28 h-2 bg-gray-600 rounded mx-auto"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Home indicator */}
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gray-600 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact & Support Section */}
      <div className="relative py-16 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-shogun text-white mb-4">Need Help Getting Started?</h2>
            <p className="text-lg text-gray-400">Our construction experts are here to help you succeed</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Phone Support */}
            <div className="text-center">
              <div className="w-16 h-16 bg-safety-orange rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Call Us</h3>
              <p className="text-safety-orange text-lg font-bold mb-2">(720) 555-IRON</p>
              <p className="text-gray-400 text-sm">Mon-Fri 7AM-6PM MT</p>
              <p className="text-gray-400 text-sm">Talk to construction experts</p>
            </div>

            {/* Email Support */}
            <div className="text-center">
              <div className="w-16 h-16 bg-aisc-blue rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Email Us</h3>
              <p className="text-aisc-blue text-lg font-bold mb-2">support@irontask.com</p>
              <p className="text-gray-400 text-sm">Response within 4 hours</p>
              <p className="text-gray-400 text-sm">Technical support & training</p>
            </div>

            {/* Live Chat */}
            <div className="text-center">
              <div className="w-16 h-16 bg-arc-flash-yellow rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Live Chat</h3>
              <p className="text-arc-flash-yellow text-lg font-bold mb-2">Available Now</p>
              <p className="text-gray-400 text-sm">Instant help & demos</p>
              <p className="text-gray-400 text-sm">Click chat bubble below</p>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-400 mb-4">Want to schedule a personalized demo?</p>
            <Button size="lg" className="bg-gray-700 hover:bg-gray-600 text-white border border-gray-600">
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Schedule a Demo
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <HardHatIcon className="h-8 w-8 text-arc-flash-yellow" />
              <span className="text-lg font-shogun text-white">Iron Task</span>
            </div>
            <p className="text-sm text-gray-500">
              © 2025 Iron Task • Denver, CO • All rights reserved
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
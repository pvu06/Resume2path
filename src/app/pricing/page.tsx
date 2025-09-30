'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Zap, Crown, ArrowRight } from 'lucide-react';
import Header from '@/components/Header';
import { PRICING_PLANS } from '@/lib/stripe';

export default function PricingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState('free');
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  // Check subscription status on component mount
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      try {
        // Get email from localStorage or prompt user
        let email = localStorage.getItem('userEmail');
        if (!email) {
          email = prompt('Please enter your email to check subscription status:');
          if (email) {
            localStorage.setItem('userEmail', email);
            setUserEmail(email);
          }
        } else {
          setUserEmail(email);
        }

        if (email) {
          const response = await fetch(`/api/subscription?email=${encodeURIComponent(email)}`);
          if (response.ok) {
            const data = await response.json();
            setSubscriptionStatus(data.subscription.status);
          }
        }
      } catch (error) {
        console.error('Error checking subscription status:', error);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkSubscriptionStatus();
  }, []);

  const handleUpgrade = async () => {
    if (!userEmail) {
      const email = prompt('Please enter your email to upgrade:');
      if (!email) return;
      setUserEmail(email);
      localStorage.setItem('userEmail', email);
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          userId: userEmail
        })
      });

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-900 to-ocean-800">
      <Header />
      
      <div className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Choose Your Plan
            </h1>
            <p className="text-xl text-ocean-200 max-w-3xl mx-auto">
              Get AI-powered career guidance that transforms your professional journey. 
              Start free, upgrade when you're ready for unlimited growth.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <Card className="bg-gradient-to-br from-ocean-800 to-ocean-900 border-ocean-700 hover:shadow-xl transition-all duration-300">
              <CardHeader className="text-center pb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-4">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-white">Free</CardTitle>
                <CardDescription className="text-ocean-200 text-lg">
                  Perfect for getting started
                </CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-white">$0</span>
                  <span className="text-ocean-200 ml-2">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4 mb-8">
                  {PRICING_PLANS.free.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-ocean-200">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full bg-ocean-600 hover:bg-ocean-700 text-white"
                  disabled
                >
                  {isCheckingStatus ? 'Checking...' : subscriptionStatus === 'free' ? 'Current Plan' : 'Downgrade'}
                </Button>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="bg-gradient-to-br from-purple-800 to-purple-900 border-purple-700 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-4 py-1 text-sm font-semibold">
                  <Star className="w-4 h-4 mr-1" />
                  Most Popular
                </Badge>
              </div>
              <CardHeader className="text-center pb-8 pt-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-4">
                  <Crown className="w-8 h-8 text-black" />
                </div>
                <CardTitle className="text-2xl font-bold text-white">Premium</CardTitle>
                <CardDescription className="text-purple-200 text-lg">
                  For serious career growth
                </CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-white">${PRICING_PLANS.premium.price}</span>
                  <span className="text-purple-200 ml-2">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4 mb-8">
                  {PRICING_PLANS.premium.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-purple-200">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  onClick={subscriptionStatus === 'premium' ? undefined : handleUpgrade}
                  disabled={isLoading || subscriptionStatus === 'premium'}
                  className={`w-full font-semibold py-3 text-lg transition-all duration-300 transform hover:scale-105 ${
                    subscriptionStatus === 'premium' 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black'
                  }`}
                >
                  {isLoading ? 'Processing...' : 
                   isCheckingStatus ? 'Checking...' :
                   subscriptionStatus === 'premium' ? '✓ Premium Active' : 'Upgrade to Premium'}
                  {subscriptionStatus !== 'premium' && <ArrowRight className="ml-2 w-5 h-5" />}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Features Comparison */}
          <div className="mt-20">
            <h2 className="text-3xl font-bold text-white text-center mb-12">
              Compare Plans
            </h2>
            <div className="bg-gradient-to-r from-ocean-800 to-ocean-900 rounded-2xl p-8 border border-ocean-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white mb-4">Monthly Analyses</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-ocean-200">Free Plan</span>
                      <span className="text-white font-semibold">3</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-purple-200">Premium Plan</span>
                      <span className="text-yellow-400 font-semibold">Unlimited</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white mb-4">AI Features</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-ocean-200">Free Plan</span>
                      <span className="text-white font-semibold">Basic</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-purple-200">Premium Plan</span>
                      <span className="text-yellow-400 font-semibold">Advanced</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white mb-4">Support</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-ocean-200">Free Plan</span>
                      <span className="text-white font-semibold">Community</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-purple-200">Premium Plan</span>
                      <span className="text-yellow-400 font-semibold">Priority</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-20">
            <h2 className="text-3xl font-bold text-white text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-ocean-800 p-6 rounded-lg border border-ocean-700">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Can I cancel anytime?
                </h3>
                <p className="text-ocean-200">
                  Yes! You can cancel your subscription at any time. You'll continue to have access to premium features until the end of your billing period.
                </p>
              </div>
              
              <div className="bg-ocean-800 p-6 rounded-lg border border-ocean-700">
                <h3 className="text-lg font-semibold text-white mb-2">
                  What payment methods do you accept?
                </h3>
                <p className="text-ocean-200">
                  We accept all major credit cards (Visa, MasterCard, American Express) through our secure Stripe payment processor.
                </p>
              </div>
              
              <div className="bg-ocean-800 p-6 rounded-lg border border-ocean-700">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is there a free trial?
                </h3>
                <p className="text-ocean-200">
                  Yes! You can try our free plan with 3 analyses per month. Upgrade to premium for unlimited access and advanced features.
                </p>
              </div>
              
              <div className="bg-ocean-800 p-6 rounded-lg border border-ocean-700">
                <h3 className="text-lg font-semibold text-white mb-2">
                  How does billing work?
                </h3>
                <p className="text-ocean-200">
                  Premium subscriptions are billed monthly. You'll be charged automatically each month until you cancel your subscription.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


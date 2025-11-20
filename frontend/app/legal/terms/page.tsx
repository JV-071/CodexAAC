import Link from 'next/link'

export default function TermsOfServicePage() {
  return (
    <div>
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                <span className="text-[#ffd700]">Terms of</span>
                <span className="text-[#3b82f6]"> Service</span>
              </h1>
              <p className="text-[#d0d0d0] text-sm">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            {/* Content */}
            <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-6 sm:p-8 shadow-2xl ring-2 ring-[#ffd700]/10">
              <div className="prose prose-invert max-w-none space-y-6 text-[#e0e0e0]">
                
                <section>
                  <h2 className="text-[#ffd700] text-2xl font-bold mb-4 pb-2 border-b border-[#404040]/40">1. Acceptance of Terms</h2>
                  <p className="text-[#d0d0d0] leading-relaxed">
                    By accessing and using CodexAAC Tibia Server, you accept and agree to be bound by the terms and provision of this agreement. 
                    If you do not agree to abide by the above, please do not use this service.
                  </p>
                </section>

                <section>
                  <h2 className="text-[#ffd700] text-2xl font-bold mb-4 pb-2 border-b border-[#404040]/40">2. Account Registration</h2>
                  <ul className="list-disc list-inside space-y-2 text-[#d0d0d0] ml-4">
                    <li>You must be at least 13 years old to create an account</li>
                    <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                    <li>You agree to provide accurate and complete information during registration</li>
                    <li>One person may only have one account. Multiple accounts are strictly prohibited</li>
                    <li>Sharing your account with others is not allowed</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-[#ffd700] text-2xl font-bold mb-4 pb-2 border-b border-[#404040]/40">3. Game Rules and Conduct</h2>
                  <p className="text-[#d0d0d0] leading-relaxed mb-3">
                    All players must adhere to the following rules:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-[#d0d0d0] ml-4">
                    <li><strong className="text-[#ffd700]">No cheating:</strong> Use of bots, macros, or any third-party software is strictly forbidden</li>
                    <li><strong className="text-[#ffd700]">No scamming:</strong> Fraudulent activities, including item scams, are prohibited</li>
                    <li><strong className="text-[#ffd700]">Respect others:</strong> Harassment, hate speech, or offensive behavior will not be tolerated</li>
                    <li><strong className="text-[#ffd700]">No real money trading:</strong> Trading in-game items for real money is strictly prohibited</li>
                    <li><strong className="text-[#ffd700]">Fair play:</strong> Exploiting bugs or glitches will result in immediate account suspension</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-[#ffd700] text-2xl font-bold mb-4 pb-2 border-b border-[#404040]/40">4. Account Suspension and Termination</h2>
                  <p className="text-[#d0d0d0] leading-relaxed">
                    We reserve the right to suspend or terminate your account at any time for violations of these terms, 
                    including but not limited to cheating, scamming, harassment, or any other behavior that disrupts the gaming experience 
                    for other players. Account termination may result in the permanent loss of all characters, items, and progress.
                  </p>
                </section>

                <section>
                  <h2 className="text-[#ffd700] text-2xl font-bold mb-4 pb-2 border-b border-[#404040]/40">5. In-Game Items and Currency</h2>
                  <ul className="list-disc list-inside space-y-2 text-[#d0d0d0] ml-4">
                    <li>All in-game items, characters, and currency are virtual and have no real-world value</li>
                    <li>Items and characters are the property of CodexAAC and may be modified or removed at our discretion</li>
                    <li>We are not responsible for lost items due to bugs, server issues, or player error</li>
                    <li>Item restoration is not guaranteed and will be evaluated on a case-by-case basis</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-[#ffd700] text-2xl font-bold mb-4 pb-2 border-b border-[#404040]/40">6. Server Maintenance and Downtime</h2>
                  <p className="text-[#d0d0d0] leading-relaxed">
                    We reserve the right to perform server maintenance, updates, or modifications at any time. 
                    While we strive to minimize downtime, we are not responsible for any loss of gameplay time or progress 
                    due to scheduled or unscheduled maintenance.
                  </p>
                </section>

                <section>
                  <h2 className="text-[#ffd700] text-2xl font-bold mb-4 pb-2 border-b border-[#404040]/40">7. Limitation of Liability</h2>
                  <p className="text-[#d0d0d0] leading-relaxed">
                    CodexAAC shall not be liable for any indirect, incidental, special, consequential, or punitive damages, 
                    including but not limited to loss of profits, data, or other intangible losses resulting from your use of the service.
                  </p>
                </section>

                <section>
                  <h2 className="text-[#ffd700] text-2xl font-bold mb-4 pb-2 border-b border-[#404040]/40">8. Changes to Terms</h2>
                  <p className="text-[#d0d0d0] leading-relaxed">
                    We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. 
                    Your continued use of the service after changes are posted constitutes acceptance of the modified terms.
                  </p>
                </section>

                <section>
                  <h2 className="text-[#ffd700] text-2xl font-bold mb-4 pb-2 border-b border-[#404040]/40">9. Contact Information</h2>
                  <p className="text-[#d0d700] leading-relaxed">
                    If you have any questions about these Terms of Service, please contact us through our support system or 
                    visit our <Link href="/support/contact" className="text-[#3b82f6] hover:underline">Contact</Link> page.
                  </p>
                </section>

              </div>

              {/* Back Button */}
              <div className="mt-8 pt-6 border-t border-[#404040]/40">
                <Link
                  href="/create-account"
                  className="inline-flex items-center gap-2 text-[#d0d0d0] hover:text-[#ffd700] transition-colors"
                >
                  <span>←</span>
                  <span>Back to Create Account</span>
                </Link>
              </div>
            </div>
          </div>
        </main>
    </div>
  )
}


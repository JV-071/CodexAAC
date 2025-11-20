import Link from 'next/link'

export default function PrivacyPolicyPage() {
  return (
    <div>
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                <span className="text-[#ffd700]">Privacy</span>
                <span className="text-[#3b82f6]"> Policy</span>
              </h1>
              <p className="text-[#d0d0d0] text-sm">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            {/* Content */}
            <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-6 sm:p-8 shadow-2xl ring-2 ring-[#ffd700]/10">
              <div className="prose prose-invert max-w-none space-y-6 text-[#e0e0e0]">
                
                <section>
                  <h2 className="text-[#ffd700] text-2xl font-bold mb-4 pb-2 border-b border-[#404040]/40">1. Information We Collect</h2>
                  <p className="text-[#d0d0d0] leading-relaxed mb-3">
                    We collect information that you provide directly to us, including:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-[#d0d0d0] ml-4">
                    <li><strong className="text-[#ffd700]">Account Information:</strong> Email address, account name, and password (encrypted)</li>
                    <li><strong className="text-[#ffd700]">Game Data:</strong> Character names, levels, items, guild membership, and gameplay statistics</li>
                    <li><strong className="text-[#ffd700]">Communication Data:</strong> Messages sent through in-game chat, support tickets, and forum posts</li>
                    <li><strong className="text-[#ffd700]">Technical Data:</strong> IP address, browser type, device information, and connection logs</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-[#ffd700] text-2xl font-bold mb-4 pb-2 border-b border-[#404040]/40">2. How We Use Your Information</h2>
                  <p className="text-[#d0d0d0] leading-relaxed mb-3">
                    We use the collected information for the following purposes:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-[#d0d0d0] ml-4">
                    <li>To provide, maintain, and improve our gaming services</li>
                    <li>To process your account registration and manage your account</li>
                    <li>To prevent fraud, cheating, and ensure fair gameplay</li>
                    <li>To communicate with you about your account, updates, and important announcements</li>
                    <li>To analyze game usage and improve user experience</li>
                    <li>To enforce our Terms of Service and investigate violations</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-[#ffd700] text-2xl font-bold mb-4 pb-2 border-b border-[#404040]/40">3. Data Security</h2>
                  <p className="text-[#d0d0d0] leading-relaxed">
                    We implement appropriate technical and organizational security measures to protect your personal information 
                    against unauthorized access, alteration, disclosure, or destruction. This includes encryption of passwords, 
                    secure server infrastructure, and regular security audits. However, no method of transmission over the Internet 
                    or electronic storage is 100% secure, and we cannot guarantee absolute security.
                  </p>
                </section>

                <section>
                  <h2 className="text-[#ffd700] text-2xl font-bold mb-4 pb-2 border-b border-[#404040]/40">4. Data Sharing and Disclosure</h2>
                  <p className="text-[#d0d0d0] leading-relaxed mb-3">
                    We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-[#d0d0d0] ml-4">
                    <li><strong className="text-[#ffd700]">Service Providers:</strong> With trusted third-party service providers who assist in operating our services (hosting, analytics, payment processing)</li>
                    <li><strong className="text-[#ffd700]">Legal Requirements:</strong> When required by law, court order, or government regulation</li>
                    <li><strong className="text-[#ffd700]">Safety and Security:</strong> To protect the rights, property, or safety of CodexAAC, our users, or others</li>
                    <li><strong className="text-[#ffd700]">Public Information:</strong> Character names, levels, and rankings may be displayed publicly on our website</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-[#ffd700] text-2xl font-bold mb-4 pb-2 border-b border-[#404040]/40">5. Cookies and Tracking Technologies</h2>
                  <p className="text-[#d0d0d0] leading-relaxed">
                    We use cookies and similar tracking technologies to track activity on our service and hold certain information. 
                    Cookies are files with a small amount of data which may include an anonymous unique identifier. 
                    You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. 
                    However, if you do not accept cookies, you may not be able to use some portions of our service.
                  </p>
                </section>

                <section>
                  <h2 className="text-[#ffd700] text-2xl font-bold mb-4 pb-2 border-b border-[#404040]/40">6. Your Rights and Choices</h2>
                  <p className="text-[#d0d0d0] leading-relaxed mb-3">
                    You have the following rights regarding your personal information:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-[#d0d0d0] ml-4">
                    <li><strong className="text-[#ffd700]">Access:</strong> Request access to your personal data</li>
                    <li><strong className="text-[#ffd700]">Correction:</strong> Request correction of inaccurate or incomplete data</li>
                    <li><strong className="text-[#ffd700]">Deletion:</strong> Request deletion of your account and associated data</li>
                    <li><strong className="text-[#ffd700]">Objection:</strong> Object to processing of your personal data</li>
                    <li><strong className="text-[#ffd700]">Data Portability:</strong> Request transfer of your data to another service</li>
                  </ul>
                  <p className="text-[#d0d0d0] leading-relaxed mt-3">
                    To exercise these rights, please contact us through our support system.
                  </p>
                </section>

                <section>
                  <h2 className="text-[#ffd700] text-2xl font-bold mb-4 pb-2 border-b border-[#404040]/40">7. Data Retention</h2>
                  <p className="text-[#d0d0d0] leading-relaxed">
                    We retain your personal information for as long as necessary to provide our services and fulfill the purposes 
                    outlined in this Privacy Policy. When you delete your account, we will delete or anonymize your personal data, 
                    except where we are required to retain it for legal, regulatory, or security purposes.
                  </p>
                </section>

                <section>
                  <h2 className="text-[#ffd700] text-2xl font-bold mb-4 pb-2 border-b border-[#404040]/40">8. Children's Privacy</h2>
                  <p className="text-[#d0d0d0] leading-relaxed">
                    Our service is not intended for children under 13 years of age. We do not knowingly collect personal information 
                    from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, 
                    please contact us immediately so we can delete such information.
                  </p>
                </section>

                <section>
                  <h2 className="text-[#ffd700] text-2xl font-bold mb-4 pb-2 border-b border-[#404040]/40">9. Changes to This Privacy Policy</h2>
                  <p className="text-[#d0d0d0] leading-relaxed">
                    We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new 
                    Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy 
                    periodically for any changes.
                  </p>
                </section>

                <section>
                  <h2 className="text-[#ffd700] text-2xl font-bold mb-4 pb-2 border-b border-[#404040]/40">10. Contact Us</h2>
                  <p className="text-[#d0d0d0] leading-relaxed">
                    If you have any questions about this Privacy Policy, please contact us through our 
                    <Link href="/support/contact" className="text-[#3b82f6] hover:underline"> support system</Link> or visit our 
                    <Link href="/support/contact" className="text-[#3b82f6] hover:underline"> Contact</Link> page.
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


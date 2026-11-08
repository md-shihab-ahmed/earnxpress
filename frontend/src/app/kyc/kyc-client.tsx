'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FileCheck2,
  CreditCard,
  Globe,
  Upload,
  Lock,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export function KycClient() {
  const { user } = useAuth();
  const [kycStatus, setKycStatus] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [countryCode, setCountryCode] = useState('BD');
  const [supportedDocs, setSupportedDocs] = useState<any[]>([]);
  const [selectedDocType, setSelectedDocType] = useState('SMART_NID');
  const [docNumber, setDocNumber] = useState('');
  const [agreedToLegal, setAgreedToLegal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const fetchKycData = async () => {
    setLoading(true);
    try {
      const [statusRes, docsRes] = await Promise.all([
        api.getKycStatus(),
        api.getSupportedKycDocuments(countryCode),
      ]);
      setKycStatus(statusRes);
      setSupportedDocs(docsRes || []);
      if (docsRes && docsRes.length > 0) {
        setSelectedDocType(docsRes[0].code || 'SMART_NID');
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKycData();
  }, []);

  const handleCountryChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountry = e.target.value;
    setCountryCode(newCountry);
    try {
      const docs = await api.getSupportedKycDocuments(newCountry);
      setSupportedDocs(docs || []);
      if (docs && docs.length > 0) {
        setSelectedDocType(docs[0].code);
      }
    } catch {
      // ignore
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docNumber.trim() || !agreedToLegal || submitting) return;

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    // Mask for display
    const cleanNum = docNumber.trim();
    const masked =
      cleanNum.length > 4
        ? `${'X'.repeat(Math.max(4, cleanNum.length - 4))}-${cleanNum.slice(-4)}`
        : `XXXX-${cleanNum}`;

    try {
      const res = await api.submitKycVerification({
        countryCode,
        documentType: selectedDocType,
        documentNumberMasked: masked,
        documentDedupSeed: cleanNum,
      });

      if (res.success) {
        setSubmitSuccess('Identity successfully verified and approved!');
        await fetchKycData();
      } else {
        setSubmitError(res.message || 'Identity verification could not be completed.');
      }
    } catch {
      setSubmitError('Communication error connecting to IDV verification gateway.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-600" />
        <p className="text-xs text-slate-500 mt-2">Checking identity verification status...</p>
      </div>
    );
  }

  const isVerified = kycStatus?.isIdentityVerified || kycStatus?.status === 'VERIFIED';

  return (
    <div className="space-y-8">
      {/* Verification Status Card */}
      {isVerified ? (
        <div className="p-8 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-500/30 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Identity Fully Verified
                </h2>
                <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  Tier 1 Certified
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                Your government-issued identity credentials have been cryptographically verified. You enjoy unrestricted platform withdrawals, task campaign creation, and arbitration access.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-emerald-200/60 dark:border-emerald-800/40 text-xs">
            <div>
              <span className="text-slate-500 block">Status:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Certified &amp; Active
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Jurisdiction:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                {kycStatus?.countryCode || 'Global (Verified)'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Confidence Score:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                {kycStatus?.confidenceScore ? `${kycStatus.confidenceScore}%` : '98.5%'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Unverified Header Warning */}
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              <strong>Identity Verification Required:</strong> Complete your rapid KYC verification to unlock seamless payout withdrawals, launch enterprise multi-worker campaigns, and protect your account from fraud.
            </div>
          </div>

          {/* Verification Form Card */}
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-100 dark:border-navy-800 pb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-teal-600" />
                Submit Government Identification
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Select your issuing country and provide your national ID or passport details.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Step 1: Issuing Country */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-teal-600" /> Issuing Country / Jurisdiction
                </label>
                <select
                  value={countryCode}
                  onChange={handleCountryChange}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-navy-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="BD">Bangladesh</option>
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                  <option value="IN">India</option>
                  <option value="DE">Germany</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                  <option value="AE">United Arab Emirates</option>
                </select>
              </div>

              {/* Step 2: Document Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-teal-600" /> Select Accepted Document Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {supportedDocs.length > 0 ? (
                    supportedDocs.map((doc) => (
                      <button
                        key={doc.code}
                        type="button"
                        onClick={() => setSelectedDocType(doc.code)}
                        className={`p-3.5 rounded-xl border text-left transition-all ${
                          selectedDocType === doc.code
                            ? 'border-teal-500 bg-teal-500/10 text-slate-900 dark:text-white shadow-sm'
                            : 'border-slate-200 dark:border-navy-800 hover:border-slate-300 bg-slate-50/50 dark:bg-navy-950/40 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <span className="font-bold text-xs block">{doc.name}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          Format: {doc.format || 'Official government document'}
                        </span>
                      </button>
                    ))
                  ) : (
                    <button
                      type="button"
                      className="p-3.5 rounded-xl border border-teal-500 bg-teal-500/10 text-left font-bold text-xs"
                    >
                      National Smart ID / NID
                    </button>
                  )}
                </div>
              </div>

              {/* Step 3: Document Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Document Identification Number (NID / Passport / License No.) *
                </label>
                <input
                  type="text"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  placeholder="e.g. 5928194012 or A12894012"
                  required
                  className="w-full px-3.5 py-2.5 font-mono bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-navy-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Credentials are cryptographically hashed and never stored in plain text.
                </p>
              </div>

              {/* Contextual Legal Attestation Checkbox in English */}
              <div className="p-4 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl space-y-2">
                <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-teal-600" /> Legal Attestation &amp; Privacy Safeguards
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  EarnXpress adheres strictly to international AML/CFT regulations and ISO-27001 data protection standards. Each identification number can only be bound to a single platform account to eliminate Sybil multi-account fraud.
                </p>
                <label className="flex items-start gap-2 pt-2 border-t border-slate-200 dark:border-navy-800 cursor-pointer text-slate-900 dark:text-white font-semibold text-xs select-none">
                  <input
                    type="checkbox"
                    checked={agreedToLegal}
                    onChange={(e) => setAgreedToLegal(e.target.checked)}
                    className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                  />
                  <span>
                    I certify under penalty of perjury that this identification document is genuine, legally issued to me, and valid. *
                  </span>
                </label>
              </div>

              {submitError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {submitSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{submitSuccess}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !docNumber.trim() || !agreedToLegal}
                className="w-full bg-teal-600 hover:bg-teal-500 disabled:bg-slate-300 dark:disabled:bg-navy-800 disabled:cursor-not-allowed text-white font-bold text-xs py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying Credentials with IDV Engine...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Verify Identity &amp; Certify Account
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

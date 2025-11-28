# Profile Sharing Feature Guide

## Overview
Merlin now has shareable public profiles that serve as a marketing and lead generation tool. Users can create rich profiles with photos, bios, and professional information, then share them with others to attract new users to the platform.

## ✨ New Features

### 1. **Enhanced User Profiles**
- Profile photo upload (2MB max, converts to base64)
- Bio/About Me section (500 character limit with counter)
- Contact information:
  - Phone number
  - Company website (clickable link)
  - LinkedIn profile (clickable link)
- Public/Private visibility toggle
- Profile sharing capability

### 2. **Profile Slugs**
- Automatic URL-friendly slug generation (e.g., `john-doe-energy`)
- Handles duplicates with counter system (`john-doe-1`, `john-doe-2`)
- Used for shareable profile URLs

### 3. **Public Profile Viewer**
- Beautiful landing page for shared profiles
- Shows profile photo, name, title, company, bio
- Displays expertise areas and project experience
- Contact links (website, LinkedIn, phone)
- Clear call-to-action for visitors to sign up
- Tracks visitors for analytics

### 4. **Visitor Tracking**
- Logs non-user visitors viewing shared profiles
- Tracks: profile slug, source, timestamp, session ID
- Stored in localStorage (`merlin_visitors` key)
- Enables analytics on profile sharing effectiveness

## 🎯 How to Use

### For Profile Owners:

1. **Complete Your Profile**
   - Click your profile icon/menu
   - Click "Edit Profile" button
   - Upload a profile photo (camera icon, 2MB max)
   - Write an about me/bio (500 chars max)
   - Add phone, company website, LinkedIn
   - Save your changes

2. **Make Profile Public**
   - In edit mode, toggle "Public" visibility
   - This generates your unique profile slug
   - Your profile becomes shareable

3. **Share Your Profile**
   - Click the "Share Profile" button
   - Profile link is copied to clipboard
   - Format: `https://merlin2.fly.dev/profile/your-slug`
   - Share on LinkedIn, email, business cards, etc.

### For Visitors (Non-Users):

1. **View Shared Profile**
   - Click on a shared profile link
   - See professional's expertise and experience
   - View contact information (website, LinkedIn)

2. **Sign Up**
   - Click "Sign Up Free" buttons
   - Create your own account
   - Start building BESS quotes

## 📊 Data Structure

### Extended User Interface
```typescript
interface User {
  // ... existing fields ...
  bio?: string;                    // About me section
  profilePhoto?: string;           // Base64 image data
  companyWebsite?: string;         // Company website URL
  linkedIn?: string;               // LinkedIn profile URL
  phone?: string;                  // Phone number
  publicProfileSlug?: string;      // e.g., "john-doe-energy"
  profileVisibility?: 'public' | 'private';  // Sharing control
}
```

### Visitor Tracking Entry
```typescript
{
  profileSlug: string,    // Which profile was viewed
  source: string,         // "profile_view", "profile_shared_by_owner", etc
  timestamp: string,      // ISO date
  sessionId: string       // Unique session identifier
}
```

## 🔧 Technical Implementation

### Files Created:
1. **EditableUserProfile.tsx** (664 lines)
   - Complete profile management component
   - Photo upload with 2MB limit
   - Edit mode with save/cancel
   - Profile sharing functionality
   - Team and invites management

2. **PublicProfileViewer.tsx** (220 lines)
   - Public profile landing page
   - Visitor tracking integration
   - Sign-up CTAs
   - 404 handling for private/missing profiles

### Files Modified:
1. **authService.ts**
   - Extended User interface with 7 new fields
   - `generateProfileSlug()` - Creates unique slugs
   - `getPublicProfile()` - Returns sanitized public profiles
   - `trackVisitor()` - Logs visitor analytics

2. **BessQuoteBuilder.tsx**
   - Added simple routing for `/profile/:slug` URLs
   - Replaced UserProfile with EditableUserProfile
   - Integrated PublicProfileViewer for public routes

## 🚀 Marketing Strategy

### Why This Feature Matters:

1. **Viral Growth** 
   - Users share profiles → New visitors discover Merlin
   - Each public profile is a marketing asset

2. **Lead Generation**
   - Track who views profiles
   - Identify interested prospects
   - Convert visitors to users

3. **Social Proof**
   - Real professionals using Merlin
   - Showcase expertise and credibility
   - Build trust with potential customers

4. **Network Effects**
   - Professionals want to be findable
   - Creates directory of energy experts
   - Merlin becomes discovery platform

5. **SEO Benefits**
   - Profile pages are indexable content
   - Keywords: names, companies, expertise areas
   - Organic search traffic

### Best Practices for Users:

- ✅ Use professional profile photo
- ✅ Write compelling bio highlighting expertise
- ✅ Include all contact information
- ✅ Share profile on LinkedIn, email signature
- ✅ Make profile public for maximum visibility
- ✅ Keep information current and updated

## 🧪 Testing Checklist

- [x] Photo upload works (2MB limit enforced)
- [x] Bio character counter functions correctly
- [x] Website/LinkedIn display as clickable links
- [x] Public/Private toggle generates slug on first public
- [x] Share button copies link to clipboard
- [x] Public profile viewer displays correct data
- [x] Visitor tracking logs entries
- [x] 404 page shows for private/missing profiles
- [x] Sign-up CTAs navigate to auth modal
- [x] Build compiles without errors
- [x] Deployed to production

## 🌐 Live URLs

- **Main App**: https://merlin2.fly.dev/
- **Example Profile**: https://merlin2.fly.dev/profile/john-doe-energy
- **GitHub Repo**: https://github.com/ugobe007/merlin2

## 📈 Future Enhancements

- [ ] Analytics dashboard showing profile views
- [ ] Email notifications when profile is viewed
- [ ] Profile badges (verified, top contributor, etc.)
- [ ] Search/directory of all public profiles
- [ ] Export profile to PDF business card
- [ ] QR code generation for easy sharing
- [ ] Integration with LinkedIn API for auto-fill
- [ ] Profile completion percentage indicator
- [ ] Recommendations/endorsements from other users

## 🎉 Success Metrics

Track these to measure feature success:
- Number of public profiles created
- Profile share clicks
- Visitor views per profile
- Visitor → Signup conversion rate
- Profile update frequency
- External referrals from shared profiles

---

**Deployed**: January 2025  
**Version**: 2.0 - Profile Sharing Update  
**Status**: ✅ Live in Production

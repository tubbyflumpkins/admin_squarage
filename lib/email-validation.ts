/**
 * Email validation utility with disposable domain detection
 */

// Common disposable email domains (this is a subset - you can expand this list)
const DISPOSABLE_DOMAINS = new Set([
  // Most common disposable email services
  '10minutemail.com',
  '10minutemail.net',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamailblock.com',
  'mailinator.com',
  'mailinator.net',
  'mailinator2.com',
  'tempmail.com',
  'tempmail.net',
  'temp-mail.org',
  'throwaway.email',
  'throwawaymail.com',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'trashmail.com',
  'trashmail.net',
  'trashmail.org',
  'sharklasers.com',
  'spam4.me',
  'grr.la',
  'guerrillamail.biz',
  'guerrillamail.de',
  'tm.tosunkaya.com',
  'inboxalias.com',
  'thankyou2010.com',
  'trash2009.com',
  'mt2009.com',
  'mt2014.com',
  'mt2015.com',
  'mytrashmail.com',
  'mailnator.com',
  'sofortmail.de',
  'wegwerfmail.de',
  'wegwerfmail.net',
  'wegwerfmail.org',
  'einrot.com',
  'einrot.de',
  'eintagsmail.de',
  'fakeinbox.com',
  'fakeinformation.com',
  'fansworldwide.de',
  'garbagemail.org',
  'gelitik.in',
  'getairmail.com',
  'getnada.com',
  'grigio.org',
  'incognitomail.com',
  'incognitomail.net',
  'incognitomail.org',
  'jetable.com',
  'jetable.net',
  'jetable.org',
  'kasmail.com',
  'kaspop.com',
  'killmail.com',
  'killmail.net',
  'klassmaster.com',
  'klzlk.com',
  'kulturbetrieb.info',
  'kurzepost.de',
  'lags.us',
  'lawlita.com',
  'letthemeatspam.com',
  'lhsdv.com',
  'lifebyfood.com',
  'link2mail.net',
  'litedrop.com',
  'lovemeleaveme.com',
  'lr78.com',
  'lroid.com',
  'lukop.dk',
  'm21.cc',
  'mail-filter.com',
  'mail-temporaire.fr',
  'mail.by',
  'mail.mezimages.net',
  'mail2rss.org',
  'mail333.com',
  'mail4trash.com',
  'mailbidon.com',
  'mailblocks.com',
  'mailbucket.org',
  'mailcat.biz',
  'mailcatch.com',
  'maildrop.cc',
  'maildx.com',
  'maileater.com',
  'mailexpire.com',
  'mailfa.tk',
  'mailforspam.com',
  'mailfreeonline.com',
  'mailguard.me',
  'mailimate.com',
  'mailin8r.com',
  'mailinater.com',
  'mailinator.org',
  'mailinator.us',
  'mailincubator.com',
  'mailismagic.com',
  'mailjunk.cc',
  'mailjunk.ga',
  'mailjunk.gq',
  'mailjunk.ml',
  'mailjunk.tk',
  'mailmate.com',
  'mailme.gq',
  'mailme.ir',
  'mailme.lv',
  'mailme24.com',
  'mailmetrash.com',
  'mailmoat.com',
  'mailms.com',
  'mailnesia.com',
  'mailnull.com',
  'mailorg.org',
  'mailpick.biz',
  'mailproxsy.com',
  'mailquack.com',
  'mailrock.biz',
  'mailscrap.com',
  'mailshell.com',
  'mailsiphon.com',
  'mailslapping.com',
  'mailslite.com',
  'mailtome.de',
  'mailtothis.com',
  'mailtrash.net',
  'mailtv.net',
  'mailtv.tv',
  'mailzilla.com',
  'mailzilla.org',
  'mailzilla.orgmbx.cc',
  'mbx.cc',
  'mega.zik.dj',
  'meinspamschutz.de',
  'meltmail.com',
  'messagebeamer.de',
  'mezimages.net',
  'mintemail.com',
  'mjukglass.nu',
  'mobi.web.id',
  'moburl.com',
  'moncourrier.fr.nf',
  'monemail.fr.nf',
  'monmail.fr.nf',
  'monumentmail.com',
  'msa.minsmail.com',
  'mx0.wwwnew.eu',
  'mycleaninbox.net',
  'mypartyclip.de',
  'mypacks.net',
  'myphantomemail.com',
  'mysamp.de',
  'myspaceinc.com',
  'myspaceinc.net',
  'myspaceinc.org',
  'myspacepimpedup.com',
  'myspamless.com',
  'mytempemail.com',
  'mytempmail.com',
  'mytrashmail.com',
  'nabuma.com',
  'neomailbox.com',
  'nepwk.com',
  'nervmich.net',
  'nervtmich.net',
  'netmails.com',
  'netmails.net',
  'netzidiot.de',
  'neverbox.com',
  'nice-4u.com',
  'nincsmail.com',
  'nincsmail.hu',
  'nnh.com',
  'no-spam.ws',
  'noblepioneer.com',
  'nobulk.com',
  'noclickemail.com',
  'nogmailspam.info',
  'nomail.pw',
  'nomail.xl.cx',
  'nomail2me.com',
  'nomorespamemails.com',
  'nonspam.eu',
  'nonspammer.de',
  'noref.in',
  'nospam.ze.tc',
  'nospam4.us',
  'nospamfor.us',
  'nospammail.net',
  'notmailinator.com',
  'nowhere.org',
  'nowmymail.com',
  'nurfuerspam.de',
  'nus.edu.sg',
  'nwldx.com',
  'objectmail.com',
  'obobbo.com',
  'odaymail.com',
  'odnorazovoe.ru',
  'one-time.email',
  'oneoffemail.com',
  'oneoffmail.com',
  'onewaymail.com',
  'onlatedotcom.info',
  'online.ms',
  'opayq.com',
  'ordinaryamerican.net',
  'otherinbox.com',
  'ourklips.com',
  'outlawspam.com',
  'ovpn.to',
  'owlpic.com',
  'pancakemail.com',
  'paplease.com',
  'pcusers.otherinbox.com',
  'pepbot.com',
  'pfui.ru',
  'pimpedupmyspace.com',
  'pjjkp.com',
  'plexolan.de',
  'poczta.onet.pl',
  'politikerclub.de',
  'poofy.org',
  'pookmail.com',
  'privacy.net',
  'privatdemail.net',
  'proxymail.eu',
  'prtnx.com',
  'punkass.com',
  'putthisinyourspamdatabase.com',
  'pwrby.com',
  'qoika.com',
  'quickinbox.com',
  'quickmail.nl',
  'rcpt.at',
  'reallymymail.com',
  'realtyalerts.ca',
  'recode.me',
  'recursor.net',
  'regbypass.com',
  'regbypass.comsafe-mail.net',
  'rejectmail.com',
  'reliable-mail.com',
  'rhyta.com',
  'rklips.com',
  'rmqkr.net',
  'royal.net',
  'rppkn.com',
  'rtrtr.com',
  's0ny.net',
  'safe-mail.net',
  'safersignup.de',
  'safetymail.info',
  'safetypost.de',
  'sandelf.de',
  'saynotospams.com',
  'schafmail.de',
  'schrott-email.de',
  'secretemail.de',
  'secure-mail.biz',
  'secure-mail.cc',
  'selfdestructingmail.com',
  'selfdestructingmail.org',
  'sendspamhere.com',
  'sharedmailbox.org',
  'sharklasers.com',
  'shieldedmail.com',
  'shieldemail.com',
  'shiftmail.com',
  'shitmail.me',
  'shitmail.org',
  'shitware.nl',
  'shortmail.net',
  'showslow.de',
  'sibmail.com',
  'sify.com',
  'sina.com',
  'sina.cn',
  'sinnlos-mail.de',
  'siteposter.net',
  'skeefmail.com',
  'slapsfromlastnight.com',
  'slaskpost.se',
  'slipry.net',
  'slopsbox.com',
  'slushmail.com',
  'smashmail.de',
  'smellfear.com',
  'smellrear.com',
  'smoug.net',
  'snakemail.com',
  'sneakemail.com',
  'sneakmail.de',
  'snkmail.com',
  'sofimail.com',
  'sofort-mail.de',
  'sogetthis.com',
  'solvemail.info',
  'soodonims.com',
  'spam.la',
  'spam.su',
  'spam4.me',
  'spamail.de',
  'spamarrest.com',
  'spamavert.com',
  'spambob.com',
  'spambob.net',
  'spambob.org',
  'spambog.com',
  'spambog.de',
  'spambog.net',
  'spambog.ru',
  'spambox.info',
  'spambox.irishspringrealty.com',
  'spambox.org',
  'spambox.us',
  'spamcannon.com',
  'spamcannon.net',
  'spamcero.com',
  'spamcon.org',
  'spamcorptastic.com',
  'spamcowboy.com',
  'spamcowboy.net',
  'spamcowboy.org',
  'spamday.com',
  'spamdecoy.net',
  'spameater.com',
  'spameater.org',
  'spamex.com'
])

/**
 * Enhanced email validation
 */
export interface EmailValidationResult {
  isValid: boolean
  email: string
  normalizedEmail: string
  error?: string
  isDisposable?: boolean
}

/**
 * Comprehensive email validation
 * @param email - The email address to validate
 * @returns Validation result with details
 */
export function validateEmail(email: string): EmailValidationResult {
  // Basic checks
  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      email: email || '',
      normalizedEmail: '',
      error: 'Email is required'
    }
  }

  // Normalize: trim and lowercase
  const normalizedEmail = email.trim().toLowerCase()

  // Length check
  if (normalizedEmail.length < 3 || normalizedEmail.length > 254) {
    return {
      isValid: false,
      email,
      normalizedEmail,
      error: 'Email address is too short or too long'
    }
  }

  // Check for spaces
  if (normalizedEmail.includes(' ')) {
    return {
      isValid: false,
      email,
      normalizedEmail,
      error: 'Email address cannot contain spaces'
    }
  }

  // Must contain exactly one @ symbol
  const atCount = (normalizedEmail.match(/@/g) || []).length
  if (atCount !== 1) {
    return {
      isValid: false,
      email,
      normalizedEmail,
      error: 'Email address must contain exactly one @ symbol'
    }
  }

  // Split into local and domain parts
  const [localPart, domainPart] = normalizedEmail.split('@')

  // Validate local part (before @)
  if (!localPart || localPart.length === 0 || localPart.length > 64) {
    return {
      isValid: false,
      email,
      normalizedEmail,
      error: 'Invalid email format - local part is invalid'
    }
  }

  // Local part checks
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return {
      isValid: false,
      email,
      normalizedEmail,
      error: 'Email address cannot start or end with a period'
    }
  }

  if (localPart.includes('..')) {
    return {
      isValid: false,
      email,
      normalizedEmail,
      error: 'Email address cannot contain consecutive periods'
    }
  }

  // Validate domain part (after @)
  if (!domainPart || domainPart.length === 0) {
    return {
      isValid: false,
      email,
      normalizedEmail,
      error: 'Email address must have a domain'
    }
  }

  // Domain must contain at least one dot
  if (!domainPart.includes('.')) {
    return {
      isValid: false,
      email,
      normalizedEmail,
      error: 'Email domain must contain at least one period'
    }
  }

  // Domain checks
  if (domainPart.startsWith('.') || domainPart.endsWith('.')) {
    return {
      isValid: false,
      email,
      normalizedEmail,
      error: 'Email domain cannot start or end with a period'
    }
  }

  if (domainPart.includes('..')) {
    return {
      isValid: false,
      email,
      normalizedEmail,
      error: 'Email domain cannot contain consecutive periods'
    }
  }

  // Check for valid domain extension
  const domainParts = domainPart.split('.')
  const tld = domainParts[domainParts.length - 1]

  if (!tld || tld.length < 2) {
    return {
      isValid: false,
      email,
      normalizedEmail,
      error: 'Email domain must have a valid extension'
    }
  }

  // RFC 5322 compliant email regex (simplified version)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

  if (!emailRegex.test(normalizedEmail)) {
    return {
      isValid: false,
      email,
      normalizedEmail,
      error: 'Invalid email format'
    }
  }

  // Check for disposable domain
  const isDisposable = DISPOSABLE_DOMAINS.has(domainPart)

  if (isDisposable) {
    return {
      isValid: false,
      email,
      normalizedEmail,
      error: 'Disposable email addresses are not allowed',
      isDisposable: true
    }
  }

  // Check for specific test/example domains that shouldn't be used in production
  const blockedTestDomains = [
    'example.com',
    'example.org',
    'example.net',
    'test.com',
    'fake.com',
    'temp.com'
  ]

  if (blockedTestDomains.includes(domainPart)) {
    return {
      isValid: false,
      email,
      normalizedEmail,
      error: 'Please use a real email address',
      isDisposable: true
    }
  }

  // Check for suspicious email prefixes with any domain
  const suspiciousPrefixes = [
    'disposable@',
    'throwaway@',
    'spam@',
    'trash@',
    'dummy@',
    'noreply@',
    'donotreply@'
  ]

  for (const prefix of suspiciousPrefixes) {
    if (normalizedEmail.startsWith(prefix)) {
      return {
        isValid: false,
        email,
        normalizedEmail,
        error: 'This email address appears to be invalid',
        isDisposable: true
      }
    }
  }

  // All checks passed
  return {
    isValid: true,
    email,
    normalizedEmail,
    isDisposable: false
  }
}

/**
 * Check if a domain is disposable
 * @param domain - The domain to check
 * @returns true if the domain is disposable
 */
export function isDisposableDomain(domain: string): boolean {
  return DISPOSABLE_DOMAINS.has(domain.toLowerCase())
}

/**
 * Add a domain to the disposable list (for runtime updates)
 * @param domain - The domain to add
 */
export function addDisposableDomain(domain: string): void {
  DISPOSABLE_DOMAINS.add(domain.toLowerCase())
}

/**
 * Get a user-friendly error message for email validation
 * @param result - The validation result
 * @returns A user-friendly error message
 */
export function getEmailErrorMessage(result: EmailValidationResult): string {
  if (result.isValid) {
    return ''
  }

  if (result.isDisposable) {
    return 'Please use a permanent email address. Temporary or disposable emails are not accepted.'
  }

  return result.error || 'Please enter a valid email address'
}
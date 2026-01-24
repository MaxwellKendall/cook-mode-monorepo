/**
 * TikTok oEmbed Service
 * Fetches metadata from TikTok posts using the official oEmbed endpoint
 */

export interface TikTokOEmbedResponse {
  author_name: string
  author_url: string
  title: string
  thumbnail_url: string
  thumbnail_width: number
  thumbnail_height: number
  html: string
}

export interface TikTokMetadata {
  author: string
  authorUrl: string
  description: string
  thumbnail: string
  thumbnailWidth: number
  thumbnailHeight: number
  success: boolean
  error?: string
}

/**
 * Fetch TikTok post metadata using the official oEmbed endpoint
 * @param url - The TikTok post URL
 * @returns Promise<TikTokMetadata>
 */
export const fetchTikTokMetadata = async (url: string): Promise<TikTokMetadata> => {
  try {
    // Validate TikTok URL format
    if (!isValidTikTokUrl(url)) {
      return {
        author: '',
        authorUrl: '',
        description: '',
        thumbnail: '',
        thumbnailWidth: 0,
        thumbnailHeight: 0,
        success: false,
        error: 'Invalid TikTok URL format'
      }
    }

    // Call TikTok oEmbed endpoint
    const response = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; RecipeApp/1.0)'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: TikTokOEmbedResponse = await response.json()

    // Extract and validate required fields
    if (!data.author_name || !data.title) {
      throw new Error('Missing required metadata fields')
    }

    return {
      author: data.author_name,
      authorUrl: data.author_url,
      description: data.title,
      thumbnail: data.thumbnail_url,
      thumbnailWidth: data.thumbnail_width,
      thumbnailHeight: data.thumbnail_height,
      success: true
    }

  } catch (error) {
    console.error('Error fetching TikTok metadata:', error)
    return {
      author: '',
      authorUrl: '',
      description: '',
      thumbnail: '',
      thumbnailWidth: 0,
      thumbnailHeight: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch TikTok metadata'
    }
  }
}

/**
 * Validate if a URL is a valid TikTok post URL
 * @param url - The URL to validate
 * @returns boolean
 */
export function isValidTikTokUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()
    
    // Check if it's a TikTok domain
    if (!hostname.includes('tiktok.com')) {
      return false
    }

    // Check if it has a video path
    const pathname = urlObj.pathname
    if (!pathname.includes('/video/') && !pathname.includes('/@')) {
      return false
    }

    return true
  } catch {
    return false
  }
}

/**
 * Extract TikTok username from URL
 * @param url - The TikTok URL
 * @returns string | null
 */
export function extractTikTokUsername(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    
    // Match @username pattern
    const match = pathname.match(/@([^/]+)/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

/**
 * Extract TikTok video ID from URL
 * @param url - The TikTok URL
 * @returns string | null
 */
export function extractTikTokVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    
    // Match video ID pattern
    const match = pathname.match(/\/video\/(\d+)/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

/**
 * Test function to validate TikTok oEmbed functionality
 * @param url - Test TikTok URL
 */
export const testTikTokOEmbed = async (url: string): Promise<void> => {
  console.log('Testing TikTok oEmbed for URL:', url)
  
  if (!isValidTikTokUrl(url)) {
    console.error('Invalid TikTok URL format')
    return
  }

  const username = extractTikTokUsername(url)
  const videoId = extractTikTokVideoId(url)
  
  console.log('Extracted username:', username)
  console.log('Extracted video ID:', videoId)

  const metadata = await fetchTikTokMetadata(url)
  
  if (metadata.success) {
    console.log('✅ Successfully fetched TikTok metadata:')
    console.log('  Author:', metadata.author)
    console.log('  Description:', metadata.description)
    console.log('  Thumbnail:', metadata.thumbnail)
  } else {
    console.error('❌ Failed to fetch TikTok metadata:', metadata.error)
  }
}

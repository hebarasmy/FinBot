export interface ChatMessage {
    id: string
    message: string
    timestamp: string
    response: string
  }
  
  export interface SearchQuery {
    id: string
    query: string
    timestamp: string
    results: number
  }
  
  
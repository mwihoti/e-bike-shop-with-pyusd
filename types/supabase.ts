export type Json = string | number | boolean | null | { [key: string]: Json | undefined} | Json []


export interface Dtabase {
    public: {
        Tables: {
          profiles: {
            Row: {
                id: string
                created_at: string
                updated_at: string
                email: string
                full_name: string | null
                avatar_url: string | null
            }
            Insert: {
                id: string
                created_at?: string
                updated_at?: string
                email: string
                full_name?: string | null
                avatar_url?: string | null
            }
            Update: {
                id?: string
                created_at?: string
                updated_at?: string
                email?: string
                full_name?: string | null
                avatar_url?: string | null        
            }
            Relationships: [
                {
                    foreignKeyName: "profiles_id_fkey"
                    columns: ["id"]
                    referencedRelation: "users"
                    referencedColumns: ["id"]
                },
            ]
          }
        }
    }
}
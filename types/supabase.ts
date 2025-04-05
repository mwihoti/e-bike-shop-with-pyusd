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
          wallets: {
            Row: {
                id: string
                user_id: string
                address: string
                created_at: string
                updated_at: string
                is_primary: boolean
            }
            Insert: {
                id?: string
                user_id:  string
                address: string
                created_at?: string
                updated_at?: string
                is_primary?: boolean
            }
            Update: {
                id?: string
                user_id?: string
                address?: string
                created_at?: string
                updated_at?: string
                is_primary?: boolean

            }
            Relationships: [
                {
                    foreignKeyName: "wallets_user_id_fkey"
                    columns: ["user_id"]
                    referencedRelation: "users"
                    referencedCollumns: ["id"]
                },
            ]
          }

          orders: {
            Row: {
                id: string
                user_id: string
                total: number
                status: string
                created_at: string
                updated_at: string
                transaction_hash: string
                is_test_purchase: boolean
                shipping_info: Json | null
                tracking_info: Json | null
            }
            Insert: {
                id?: string
                user_id: string
                total: number
                status: string
                created_at?: string
                updated_at?: string
                transaction_hash: string
                is_test_purchase?: boolean
                shpping_info?: Json | null
                tracking_info?: Json | null
            }
            Update: {
                id?: string
                user_id?: string
                total?: number
                status?: string
                created_at?: string
                updated_at?: string
                transaction_hash?: string
                is_test_purchase?: boolean
                shipping_info?: Json | null
                tracking_info?: Json | null
          }
          Relationships: [
            {
                foreignKeyName: "orders_user_id_fkey"
                columns: ["user_id"]
                referenceRelation: "users"
                referencedColumns: ["id"]
            },
          ]
        }
        order_items: {
            Row: {
                id: string
                order_id: string
                product_id: string
                quantity: number
                price: number
                name: string
                image: string
            }
            Insert: {
                id?: string
                order_id: string
                product_id: string
                quantity: number
                price: number
                name: string
                image: string
            }
            Update: {
                id?: string
                order_id?: string
                product_id?: string
                quantity?: number
                price?: number
                name?: string
                image?: string
            }
            Relationships: [
                {
                    foreignKeyName: "order_items_order_id_fkey"
                    columns: ["order_id"]
                    referencedRelation: "orders"
                    referencedColumns: ["id"]
                },
            ]
        }
        reviews: {
            Row: {
                id: string
                user_id: string
                product_id: string
                rating: number
                comment: string
                created_at: string
            }
            Insert: {
                id?: string
                user_id: string
                product_id: string
                rating: number
                comment: string
                created_at?: string
            }
            Update: {
                id?: string
                user_id?: string
                product_id?: string
                rating?: number
                comment?: string
                created_at?: string
            }
            Relationships: [
                {
                    foreignKeyName: "reviews_user_id_fkey"
                    columns: ["user_id"]
                    referencedRelation: "users"
                    referencedColumns: ["id"]
                }
            ]
        }
    }
    Views: {
        [_ in never]: never
    }
    Functions: {
        [_ in never]: never
    }
    Enums: {
        [_ in never]: never
    }
}
}
"use client"

import { useState } from "react"
import { useOrders } from "@/hooks/use-orders"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Star } from "lucide-react"
import Image from "next/image"
import { ST } from "next/dist/shared/lib/utils"

export function ProductReviewForm({ product, onClose }) {
  const { addReview, hasReviewed } = useOrders()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [hoveredRating, setHoveredRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(hasReviewed(product.id))

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Add review
    addReview(product.id, rating, comment)

    // Show success message
    setIsSubmitted(true)
    setIsSubmitting(false)

    // close after 2 seconds
    setTimeout(() => {
        onClose()
    }, 2000)
  }


  return (
    <div className="space-y-4">
        <div className="flex items-start gap-3">
            <div className="relative h-16 w-16 rounded-md overflow-hidden flex-shrink-0">
                <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
            </div>
            <div>
                <h4 className="font-medium">{product.name}</h4>
                <p className="text-sm text-muted-foreground">{product.price.toFixed(2)} PYUSD</p>
            </div>
        </div>

        {isSubmitted ? (
            <div className="text-center py-4">
                <div className="flex justify-center mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                            key={star}
                            className={`h-6 w-6 ${star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                            />
                    ))}
                    </div>
                    <p className="text-green-600 font-medium">Thank you for your review!</p>

                </div>
        ) : (
            <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="rating">Rating</Label>
                        <div className="flex items-center gap-1 mt-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                 key={star}
                                 className={`h-6 w-6 cursor-pointer ${
                                    star <= (hoveredRating || rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                                 }`}
                                 onClick={() => setRating(star)}
                                 onMouseEnter={() => setHoveredRating(star)}
                                 onMouseLeave={() => setHoveredRating(0)}
                                 />

                            ))}
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="comment">Your Review</Label>
                        <Textarea
                            id="comment"
                            placeholder="share your experience with this product..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="mt-1"
                            rows={4}
                            required
                            />
                    </div>

                    <div className="flex justify-end  gap-2">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                            </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Submitting..." : "Submit Review"}
                        </Button>
                    </div>
                </div>
            </form>
        )}

    </div>
  )
}
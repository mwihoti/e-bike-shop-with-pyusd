"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useCart } from "@/hooks/use-cart"
import { useOrders } from "@/hooks/use-orders"
import { getProductById } from "@/lib/marketplace"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { WalletStatus } from "@/components/marketplace/wallet-status"
import { 
  ArrowLeft, 
  Check, 
  MinusCircle, 
  PlusCircle, 
  ShoppingCart, 
  Star, 
  RotateCw, 
  Box, 
  X 
} from "lucide-react" 
import Link from "next/link"
import Image from "next/image"
import * as THREE from 'three'

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const { addItem, updateItemQuantity, getItem } = useCart()
  const { getReviews } = useOrders()
  const [product, setProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [isAdded, setIsAdded] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [reviews, setReviews] = useState([])
  const [rotation, setRotation] = useState(0)
  const [is3DView, setIs3DView] = useState(false)
  const [is360View, setIs360View] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const threeContainerRef = useRef(null)
  const imageContainerRef = useRef(null)
  const rendererRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const modelRef = useRef(null)
  const textureLoaderRef = useRef(null)

  // Get product ID from URL
  const id = params.id

  // Prevent hydration errors
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Fetch product data
  useEffect(() => {
    if (id) {
      const productData = getProductById(id)
      if (productData) {
        setProduct(productData)

        // Check if product is already in cart
        const cartItem = getItem(id)
        if (cartItem) {
          setQuantity(cartItem.quantity)
          setIsAdded(true)
        }
      } else {
        // Product not found, redirect to marketplace
        router.push("/marketplace")
      }
    }
  }, [id, router, getItem])

  // Fetch reviews
  useEffect(() => {
    if (isMounted && id) {
      const productReviews = getReviews(id)
      setReviews(productReviews)
    }
  }, [isMounted, id, getReviews])

  // Initialize and clean up Three.js
  useEffect(() => {
    if (is3DView && isMounted && threeContainerRef.current && product) {
      // Setup Three.js scene
      const container = threeContainerRef.current;
      const width = container.clientWidth;
      const height = container.clientHeight;

      // Create texture loader
      textureLoaderRef.current = new THREE.TextureLoader();

      // Create scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf5f5f5);
      sceneRef.current = scene;

      // Create camera
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.z = 3;
      cameraRef.current = camera;

      // Create renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Add lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(1, 1, 1);
      scene.add(directionalLight);

      // Create a textured plane using the product image
      const createTexturedModel = () => {
        // Create a plane geometry
        const planeGeometry = new THREE.PlaneGeometry(2.5, 2.5);
        
        // Load the product image as a texture
        textureLoaderRef.current.load(product.image || "/placeholder.svg", (texture) => {
          const material = new THREE.MeshStandardMaterial({
            map: texture,
            side: THREE.DoubleSide,
          });
          
          const plane = new THREE.Mesh(planeGeometry, material);
          scene.add(plane);
          modelRef.current = plane;
          
          // Create a backing plane slightly behind the image
          const backingGeometry = new THREE.PlaneGeometry(2.6, 2.6);
          const backingMaterial = new THREE.MeshStandardMaterial({
            color: 0xeeeeee,
            side: THREE.DoubleSide,
          });
          
          const backingPlane = new THREE.Mesh(backingGeometry, backingMaterial);
          backingPlane.position.z = -0.05;
          scene.add(backingPlane);
        });
      };
      
      // Create a 3D box with the product image on all sides as an alternative
      const createTexturedBox = () => {
        // Load the product image as a texture
        textureLoaderRef.current.load(product.image || "/placeholder.svg", (texture) => {
          const materials = Array(6).fill().map(() => new THREE.MeshStandardMaterial({ map: texture }));
          const boxGeometry = new THREE.BoxGeometry(2, 2, 2);
          const box = new THREE.Mesh(boxGeometry, materials);
          scene.add(box);
          modelRef.current = box;
        });
      };
      
      // Create a model representation based on the product image
      createTexturedBox();

      // Animation function
      const animate = () => {
        if (!rendererRef.current) return;
        requestAnimationFrame(animate);
        
        // Auto-rotate slightly when not being dragged
        if (!isDragging && modelRef.current) {
          modelRef.current.rotation.y += 0.005;
        }
        
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      };

      animate();

      // Handle window resize
      const handleResize = () => {
        if (cameraRef.current && rendererRef.current && container) {
          const width = container.clientWidth;
          const height = container.clientHeight;
          
          cameraRef.current.aspect = width / height;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(width, height);
        }
      };

      window.addEventListener('resize', handleResize);

      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize);
        if (rendererRef.current && rendererRef.current.domElement) {
          try {
            container.removeChild(rendererRef.current.domElement);
          } catch (e) {
            console.error("Error removing renderer:", e);
          }
        }
        rendererRef.current = null;
        sceneRef.current = null;
        cameraRef.current = null;
        modelRef.current = null;
        textureLoaderRef.current = null;
      };
    }
  }, [is3DView, isMounted, product]);

  if (!isMounted || !product) {
    return null
  }

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
      if (isAdded) {
        updateItemQuantity(id, quantity - 1)
      }
    }
  }

  const increaseQuantity = () => {
    setQuantity(quantity + 1)
    if (isAdded) {
      updateItemQuantity(id, quantity + 1)
    }
  }

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity,
    })
    setIsAdded(true)
  }

  // Calculate average rating
  const averageRating =
    reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0

  // Format date
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString()
  }

  // Handle button click rotation
  const rotateImage = () => {
    setRotation((prevRotation) => (prevRotation + 15) % 360)
  }

  // Handle 3D view toggle
  const toggle3DView = () => {
    setIs3DView(!is3DView)
    if (is360View) setIs360View(false)
  }

  // Handle 360 view toggle
  const toggle360View = () => {
    setIs360View(!is360View)
    if (is3DView) setIs3DView(false)
  }

  // Exit all special views
  const exitSpecialViews = () => {
    setIs360View(false)
    setIs3DView(false)
    setRotation(0)
  }

  // Mouse/touch interaction for 3D view
  const handle3DMouseDown = (e) => {
    if (is3DView) {
      setIsDragging(true)
      setStartX(e.clientX)
    }
  }

  const handle3DMouseMove = (e) => {
    if (isDragging && modelRef.current) {
      const deltaX = e.clientX - startX
      modelRef.current.rotation.y += deltaX * 0.01
      setStartX(e.clientX)
    }
  }

  const handle3DMouseUp = () => {
    setIsDragging(false)
  }

  const handle3DTouchStart = (e) => {
    if (is3DView) {
      setIsDragging(true)
      setStartX(e.touches[0].clientX)
    }
  }

  const handle3DTouchMove = (e) => {
    if (isDragging && modelRef.current) {
      const deltaX = e.touches[0].clientX - startX
      modelRef.current.rotation.y += deltaX * 0.01
      setStartX(e.touches[0].clientX)
    }
  }

  const handle3DTouchEnd = () => {
    setIsDragging(false)
  }

  // Mouse/touch interaction for 360 view
  const handle360MouseDown = (e) => {
    if (is360View) {
      setIsDragging(true)
      setStartX(e.clientX)
    }
  }

  const handle360MouseMove = (e) => {
    if (isDragging && is360View) {
      const deltaX = e.clientX - startX
      setRotation((prev) => {
        let newRotation = prev + deltaX * 0.5
        // Normalize to 0-360
        while (newRotation < 0) newRotation += 360
        return newRotation % 360
      })
      setStartX(e.clientX)
    }
  }

  const handle360MouseUp = () => {
    setIsDragging(false)
  }

  const handle360TouchStart = (e) => {
    if (is360View) {
      setIsDragging(true)
      setStartX(e.touches[0].clientX)
    }
  }

  const handle360TouchMove = (e) => {
    if (isDragging && is360View) {
      const deltaX = e.touches[0].clientX - startX
      setRotation((prev) => {
        let newRotation = prev + deltaX * 0.5
        while (newRotation < 0) newRotation += 360
        return newRotation % 360
      })
      setStartX(e.touches[0].clientX)
    }
  }

  const handle360TouchEnd = () => {
    setIsDragging(false)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <Link href="/marketplace">
          <Button variant="ghost" className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </Button>
        </Link>
        <WalletStatus />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden shadow-lg">
          {/* Product Image View Modes */}
          {is3DView ? (
            <div 
              ref={threeContainerRef}
              className="relative aspect-square w-full h-full"
              onMouseDown={handle3DMouseDown}
              onMouseMove={handle3DMouseMove}
              onMouseUp={handle3DMouseUp}
              onMouseLeave={handle3DMouseUp}
              onTouchStart={handle3DTouchStart}
              onTouchMove={handle3DTouchMove}
              onTouchEnd={handle3DTouchEnd}
            >
              {/* Info overlay for 3D view */}
              <div className="absolute p-2 top-2 right-2 bg-white/70 dark:bg-slate-700/70 rounded text-xs">
                Drag to rotate
              </div>
              
              {/* Exit button for 3D view */}
              <Button 
                variant="outline" 
                size="sm" 
                className="absolute top-2 left-2 bg-white/70 dark:bg-slate-700/70 hover:bg-white hover:dark:bg-slate-700"
                onClick={exitSpecialViews}
              >
                <X className="h-4 w-4 mr-2" />
                Exit 3D
              </Button>
            </div>
          ) : is360View ? (
            <div 
              ref={imageContainerRef}
              className="relative aspect-square"
              onMouseDown={handle360MouseDown}
              onMouseMove={handle360MouseMove}
              onMouseUp={handle360MouseUp}
              onMouseLeave={handle360MouseUp}
              onTouchStart={handle360TouchStart}
              onTouchMove={handle360TouchMove}
              onTouchEnd={handle360TouchEnd}
            >
              <Image 
                src={product.image || "/placeholder.svg"} 
                alt={product.name} 
                fill 
                className="max-h-full"
                style={{ transform: `rotate(${rotation}deg)` }}
              />
              
              {/* Info overlay for 360 view */}
              <div className="absolute p-2 top-2 right-2 bg-white/70 dark:bg-slate-700/70 rounded text-xs">
                Drag to rotate
              </div>
              
              {/* Exit button for 360 view */}
              <Button 
                variant="outline" 
                size="sm" 
                className="absolute top-2 left-2 bg-white/70 dark:bg-slate-700/70 hover:bg-white hover:dark:bg-slate-700"
                onClick={exitSpecialViews}
              >
                <X className="h-4 w-4 mr-2" />
                Exit 360°
              </Button>
            </div>
          ) : (
            <div className="relative aspect-square">
              <Image 
                src={product.image || "/placeholder.svg"} 
                alt={product.name} 
                fill 
                className="max-h-full transition-transform hover:scale-105"
              />
            </div>
          )}
          
          {/* Image Controls */}
          <div className="flex justify-center gap-4 p-4 bg-gray-50 dark:bg-slate-700">
            <Button 
              variant={is360View ? "secondary" : "outline"} 
              onClick={toggle360View}
              disabled={is3DView}
            >
              <RotateCw className="h-4 w-4 mr-2" />
              {is360View ? "Exit 360° View" : "View in 360°"}
            </Button>
            
            <Button 
              variant={is3DView ? "secondary" : "outline"} 
              onClick={toggle3DView}
              disabled={is360View}
            >
              <Box className="h-4 w-4 mr-2" />
              {is3DView ? "Exit 3D View" : "View in 3D"}
            </Button>
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-2 text-slate-800 dark:text-slate-100">{product.name}</h1>

          <div className="flex items-center mb-4">
            <Badge variant="secondary" className="mr-2">
              {product.category}
            </Badge>
            {product.inStock ? (
              <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                In Stock
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">
                Out of Stock
              </Badge>
            )}

            {reviews.length > 0 && (
              <div className="flex items-center ml-3">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= Math.round(averageRating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm ml-1">({reviews.length})</span>
              </div>
            )}
          </div>

          <p className="text-2xl font-bold mb-4 text-primary">{product.price.toFixed(2)} PYUSD</p>

          <p className="text-slate-600 dark:text-slate-300 mb-6">{product.description}</p>

          <Separator className="my-6" />

          <div className="space-y-6">
            <div className="flex items-center">
              <span className="mr-4 font-medium">Quantity:</span>
              <div className="flex items-center">
                <Button variant="outline" size="icon" onClick={decreaseQuantity} disabled={quantity <= 1}>
                  <MinusCircle className="h-4 w-4" />
                </Button>
                <span className="mx-4 font-medium">{quantity}</span>
                <Button variant="outline" size="icon" onClick={increaseQuantity}>
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center">
              <span className="mr-4 font-medium">Total:</span>
              <span className="text-lg font-bold">{(product.price * quantity).toFixed(2)} PYUSD</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="flex-1" onClick={handleAddToCart} disabled={!product.inStock || isAdded}>
                {isAdded ? (
                  <>
                    <Check className="mr-2 h-5 w-5" />
                    Added to Cart
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Add to Cart
                  </>
                )}
              </Button>

              {isAdded && (
                <Link href="/marketplace/checkout" className="flex-1">
                  <Button className="w-full">Proceed to Checkout</Button>
                </Link>
              )}
            </div>
          </div>

          <Card className="mt-8">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Product Details</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-slate-300">
                {product.details.map((detail, index) => (
                  <li key={index}>{detail}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>

        {reviews.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No reviews yet. Be the first to review this product!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="mb-2">{review.comment}</p>
                      <p className="text-sm text-muted-foreground">
                        By {review.userAddress.substring(0, 6)}...
                        {review.userAddress.substring(review.userAddress.length - 4)} on {formatDate(review.timestamp)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
'use client'

import { useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { ShoppingCart, Eye } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useCart } from "@/hooks/use-cart"
import * as THREE from 'three'

export function ProductCard({ product }) {
    const { addItem } = useCart()
    const containerRef = useRef(null)
    const [isHovering, setIsHovering] = useState(false)
    const sceneRef = useRef(null)
    const rendererRef = useRef(null)
    const cameraRef = useRef(null)
    const textureRef = useRef(null)
    const meshRef = useRef(null)
    const animationRef = useRef(null)
    const uniqueId = useRef(`product-${product.id}`).current

    const handleAddToCart = (e) => {
        e.preventDefault() // Prevent navigation
        e.stopPropagation() // Stop event propagation

        addItem({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1,
        })
    }
// setup Three.js scene
    useEffect(() => {
        if (!containerRef.current) return

        // Initialize scene
        const scene = new THREE.Scene()
        sceneRef.current = scene

        // Initialize camera
        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
        camera.position.z = 1.5
        cameraRef.current = camera

        // Initialize renderer
        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            preserveDrawingBuffer: true,
            antialias: true
        })
        renderer.setClearColor(0x000000, 0) // Transparent background

        // Get container dimensions
        const containerWidth = containerRef.current.clientWidth || 300
        const containerHeight = containerRef.current.clientHeight || 300
        renderer.setSize(containerWidth, containerHeight)
        rendererRef.current = renderer

        // Clear container first
        while (containerRef.current.firstChild) {
            containerRef.current.removeChild(containerRef.current.firstChild)
        }

        containerRef.current.appendChild(renderer.domElement)
        renderer.domElement.style.width = '100%'
        renderer.domElement.style.height = '100%'
        renderer.domElement.id = uniqueId

        // Make sure canvas  is not blocking clicks
        renderer.domElement.style.pointerEvents = 'auto'

        // Load texture
        const textureLoader = new THREE.TextureLoader()
        textureLoader.load(product.image, (texture) => {
            textureRef.current = texture

            // Create a plane with the image as texture
            const geometry = new THREE.PlaneGeometry(2, 2)
            const material = new THREE.MeshBasicMaterial({
                map: texture,
                side: THREE.DoubleSide
            })

            const mesh = new THREE.Mesh(geometry, material)
            meshRef.current = mesh
            scene.add(mesh)

            // Initial render
            renderer.render(scene, camera)
        })

        // Cleanup function
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
            if (rendererRef.current && rendererRef.current.domElement && containerRef.current) {
                containerRef.current.removeChild(rendererRef.current.domElement)
            }
            if (meshRef.current) {
                meshRef.current.geometry.dispose()
                meshRef.current.material.dispose()
            }
            if (textureRef.current) {
                textureRef.current.dispose()
            }
            if (sceneRef.current) {
                while (sceneRef.current.children.length > 0) {
                    sceneRef.current.remove(sceneRef.current.children[0])
                }
            }
        }
    }, [product.image, uniqueId])
// animation effect
    useEffect(() => {
        if (!meshRef.current || !sceneRef.current || !cameraRef.current || !rendererRef.current) return
        let frameId = null;

        // Animation function
        const animate = () => {

            if (isHovering) {
                // Rotate to 180 degrees (π radians) when hovering
                if (meshRef.current.rotation.y < Math.PI) {
                    meshRef.current.rotation.y += 0.02 // Slower rotation
                } else {
                    meshRef.current.rotation.y = Math.PI
                }
            } else {
                // Rotate back to 0 when not hovering
                if (meshRef.current.rotation.y > 0) {
                    meshRef.current.rotation.y -= 0.02 // Slower rotation
                } else {
                    meshRef.current.rotation.y = 0
                }
            }

            rendererRef.current.render(sceneRef.current, cameraRef.current)
            frameId = requestAnimationFrame(animate)
        }
// start animation
        animate()
// store frame ID in ref cleanup
animationRef.current = frameId
// cleanup function
        return () => {
            if (frameId) {
                cancelAnimationFrame(frameId)
            }
        }
    }, [isHovering])

    // Debug the hover state
    useEffect(() => {
        console.log(`Product ${product.id} hover state:`, isHovering)
    }, [isHovering, product.id])

    // Handle hover events
    const handleMouseEnter = () => {
        console.log(`Mouse enter on product ${product.id}`)
        setIsHovering(true)

    }
    const handleMouseLeave = () => {
        console.log(`Mouse leave on product ${product.id}`
           
        )
        setIsHovering(false)
    }

    return (
        <Card className="overflow-hidden transition-all hover:shadow-md">
            <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="cursor-pointer">
            <Link
                href={`/marketplace/${product.id}`}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
            >
                <div className="relative aspect-square overflow-hidden flex items-center justify-center">
                    <div className="relative h-auto w-auto max-h-full max-w-full">
                        <div
                            ref={containerRef}
                            className="w-full h-full"
                            style={{ pointerEvents: "auto"}}
                        />
                    </div>
                </div>
            </Link>
            </div>

            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <Link href={`/marketplace/${product.id}`} className="hover:underline">
                        <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
                    </Link>
                    <Badge variant="secondary">{product.category}</Badge>
                </div>

                <p className="text-primary font-bold">{product.price.toFixed(2)} PYUSD</p>
                <p className="text-sm text-muted--foreground line-clamp-2 mt-2">{product.description}</p>
            </CardContent>

            <CardFooter className="p-4 pt-0 flex gap-2">
                <Button variant="outline" className="w-full" onClick={handleAddToCart}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to Cart
                </Button>
                <Link href={`/marketplace/${product.id}`} className="w-full">
                    <Button variant="secondary" className="w-full">
                        <Eye className="mr-2 h-4 w-4" />
                        View
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    )
}
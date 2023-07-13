import slugify from "slugify"
import productModel from "../models/productModel.js"
import fs from 'fs'
import categoryModel from "../models/categoryModel.js"
import braintree from "braintree"
import mongoose from "mongoose"
import orderModel from "../models/orderModel.js"
import dotenv from 'dotenv'
dotenv.config()
//payment gateway
const gateway = new braintree.BraintreeGateway({
    environment: braintree.Environment.Sandbox,
    merchantId: process.env.BRAINTREE_MERCHANT_ID,
    publicKey: process.env.BRAINTREE_PUBLIC_KEY,
    privateKey: process.env.BRAINTREE_PRIVATE_KEY,
});



export const createProductController = async (req, res) => {
    try {
        const { name, slug, description, quantity, price, category, shipping } = req.fields
        const { photo } = req.files

        //validation
        switch (true) {
            case !name:
                return res.status(500).send({ error: 'Name is Required' })
            case !category:
                return res.status(500).send({ error: 'Category is Required' })

            case !quantity:
                return res.status(500).send({ error: 'Quantity is Required' })
            case !description:
                return res.status(500).send({ error: 'Description is Required' })
            case !price:
                return res.status(500).send({ error: 'Price is Required' })
            case !photo && photo.size() > 1000000:
                return res.status(500).send({ error: 'Photo is Required and Should be less than 1MB' })
        }
        const products = await new productModel({ ...req.fields, slug: slugify(name) })
        if (photo) {
            products.photo.data = fs.readFileSync(photo.path)
            products.photo.contentType = photo.type
        }
        await products.save()
        res.status(201).send({
            message: 'Product Created Succesfully',
            success: true,
            products
        })
    } catch (error) {
        console.log(error)
        res.status(500).send({
            success: false,
            message: "Error in creating the Product",
            error
        })
    }
}
//Get allproducts Controller
export const getProductsController = async (req, res) => {
    try {
        //only calling product details without photo to reduce request time and load
        const products = await productModel.find({}).select("-photo").limit(12).sort({ createdAt: -1 }).populate('category')
        res.status(200).send({
            success: true,
            totalCount: products.length,
            message: 'Getting All products Succesfully',
            products
        })
    } catch (error) {
        console.log(error)
        res.status(500).send({
            success: false,
            message: "Error in Getting Products",
            error
        })
    }
}
//get single product controller
export const getSingleProductController = async (req, res) => {
    try {

        const product = await productModel.findOne({ slug: req.params.slug }).select('-photo').populate('category')
        res.status(200).send({
            success: true,
            message: 'Single product fetched Successfully',
            product
        })
    } catch (error) {
        console.log(error)
        res.status(500).send({
            success: false,
            message: 'Error in Getting single product',
            error
        })
    }
}
//Get photo of a single product
export const productPhotoController = async (req, res) => {
    try {
        const product = await productModel.findById(req.params.pid).select('photo')
        if (product.photo.data) {
            res.set('Content-type', product.photo.contentType)
            return res.status(200).send(product.photo.data)
        }
    } catch (error) {
        console.log(error)
        res.status(500).send({
            success: false,
            message: 'Error in getting Image',
            error
        })
    }
}
//delete single product
export const productDeleteController = async (req, res) => {
    try {
        await productModel.findByIdAndDelete(req.params.pid).select('-photo')
        res.status(200).send({
            success: true,
            message: 'Product Deleted Successfully',
        })
    } catch (error) {
        console.log(error)
        res.status(500).send({
            success: false,
            message: 'Error in Deleting Product',
            error
        })
    }
}
//update product controller
export const updateProductController = async (req, res) => {
    try {
        const { name, slug, description, quantity, price, category, shipping } = req.fields
        const { photo } = req.files

        //validation
        switch (true) {
            case !name:
                return res.status(500).send({ error: 'Name is Required' })
            case !category:
                return res.status(500).send({ error: 'Category is Required' })

            case !quantity:
                return res.status(500).send({ error: 'Quantity is Required' })
            case !description:
                return res.status(500).send({ error: 'Description is Required' })
            case !price:
                return res.status(500).send({ error: 'Price is Required' })
            case !photo && photo.size() > 1000000:
                return res.status(500).send({ error: 'Photo is Required and Should be less than 1MB' })
        }
        const products = await productModel.findByIdAndUpdate(req.params.pid, { ...req.fields, slug: slugify(name) }, { new: true })
        if (photo) {
            products.photo.data = fs.readFileSync(photo.path)
            products.photo.contentType = photo.type
        }
        await products.save()
        res.status(201).send({
            message: 'Product updated Succesfully',
            success: true,
            products
        })
    } catch (error) {
        console.log(error)
        res.status(500).send({
            success: false,
            message: "Error in updating the Product",
            error
        })
    }
}
// Filter Controller
export const filterController = async (req, res) => {
    try {
        let args = {}
        const { checked, radio } = req.body
        if (checked.length > 0) args.category = checked
        if (radio.length) args.price = { $gte: radio[0], $lte: radio[1] }
        const products = await productModel.find(args)
        res.status(200).send({
            success: true,
            products
        })

    } catch (error) {
        console.log(error)
        res.status(400).send({
            success: false,
            message: 'Error in Filtering',
            error
        })
    }
}
//Get count of total Number of products
export const productCountController = async (req, res) => {
    try {
        const total = await productModel.find({}).estimatedDocumentCount()
        res.status(200).send({
            success: true,
            total
        })
    } catch (error) {
        console.log(error)
        res.status(400).send({
            message: 'Error in Getting Product Count',
            success: false,
            error
        })
    }
}
//Product per page
export const productListController = async (req, res) => {
    try {
        const perpage = 3
        const page = req.body.page
        const products = await productModel
            .find({})
            .select('-photo')
            .skip((page - 1) * perpage)
            .limit(perpage)
            .sort({ createdAt: -1 })
        res.status(200).send({
            success: true,
            products
        })
    } catch (error) {
        console.log(error)
        res.status(400).send({
            success: false,
            message: 'Error in fetching further Products',
            error
        })
    }
}

//product Search ||Get Product
export const searchController = async (req, res) => {
    try {
        const { keyword } = req.params
        const result = await productModel.find({
            $or: [
                { name: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } }
            ]
        }).select('-photo')
        res.json(result)

    } catch (error) {
        console.log(error)
        res.status(400).send({
            success: false,
            message: 'Error In searching the Products',
            error
        })
    }
}

// get related products ||GET
export const relatedProductController = async (req, res) => {
    try {
        const { pid, cid } = req.params
        const product = await productModel.find({
            category: cid,
            _id: { $ne: pid },
        }).select('-photo')
            .limit(3)
            .populate("category")
        res.status(200).send({
            message: "Related Products Fetched Successfully",
            success: true,
            product
        })
    } catch (error) {
        console.log(error)
        res.status(400).send({
            message: 'Error in fetching related products',
            success: false,
            error
        })
    }
}


//Product Category Controller || GET product by category
export const productCategoryController = async (req, res) => {
    try {
        const category = await categoryModel.findOne({ slug: req.params.slug })
        const products = await productModel.find({
            category: category
        }).populate('category').select('-photo')
        res.status(200).send({
            success: true,
            message: 'Fetched All products of this category',
            products,
            category
        })
    } catch (error) {
        console.log(error)
        res.status(400).send({
            success: false,
            message: 'Error in getting Product of this category',
            error
        })
    }
}
//-----------------------------------------------------------------------------------------------------------
// Payment Gateway Part
//token from braintree
export const braintreeTokenController = async (req, res) => {
    try {
        gateway.clientToken.generate({}, function (err, response) {
            if (err) {
                res.status(500).send(err)
            }
            else {
                res.send(response)
            }
        })
    } catch (error) {
        console.log(error)
    }
}
//payments controller
export const braintreePaymentController = async (req, res) => {
    try {
        const { cart, nonce } = req.body
        let total = 0;
        cart.map((i) => { total += i.price })
        let newTransaction = gateway.transaction.sale({
            amount: total,
            paymentMethodNonce: nonce,
            options: {
                submitForSettlement: true,
            }
        },
            function (error, result) {
                if (result) {
                    const order = new orderModel({
                        products: cart,
                        payment: result,
                        buyer: req.user._id
                    }).save()
                    res.json({ ok: true })
                } else {
                    res.status(500).send(error)
                }
            }
        )

    } catch (error) {
        console.log(error)
    }
}
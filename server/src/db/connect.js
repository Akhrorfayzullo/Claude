import mongoose from 'mongoose'

export async function connectToDatabase(mongodbUri) {
  if (!mongodbUri) {
    throw new Error('MONGODB_URI is required. Add it to server/.env before starting the API.')
  }

  mongoose.set('strictQuery', true)

  await mongoose.connect(mongodbUri)
}

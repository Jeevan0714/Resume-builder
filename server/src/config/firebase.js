require('dotenv').config()
const { initializeApp, getApps, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const { getAuth } = require('firebase-admin/auth')
const admin = require('firebase-admin')

let app
let realDb = null
let isInitializedWithCert = false

if (!getApps().length) {
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  let privateKey = process.env.FIREBASE_PRIVATE_KEY

  if (privateKey) {
    privateKey = privateKey.trim()
    if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
      privateKey = privateKey.slice(1, -1)
    }
    privateKey = privateKey.replace(/\\n/g, '\n')
  }

  const hasCredentials = projectId && clientEmail && privateKey && !projectId.includes('your_project_id') && !privateKey.includes('YOUR_KEY_HERE')

  if (hasCredentials) {
    try {
      app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      })
      realDb = getFirestore(app)
      isInitializedWithCert = true
    } catch (error) {
      console.warn('⚠️ Firebase Admin credential initialization error:', error.message)
      app = initializeApp({ projectId: projectId || 'demo-project' })
    }
  } else {
    app = initializeApp({ projectId: projectId || 'demo-project' })
  }
} else {
  app = getApps()[0]
}

const auth = getAuth(app)

// In-memory fallback database for local dev when service account key is missing
const inMemoryStore = new Map()

const safeDb = {
  collection(colName) {
    return {
      doc(docId) {
        return {
          collection(subColName) {
            return {
              doc(subDocId) {
                const key = `${colName}/${docId}/${subColName}/${subDocId}`
                return {
                  async set(data) {
                    if (isInitializedWithCert && realDb) {
                      try { return await realDb.collection(colName).doc(docId).collection(subColName).doc(subDocId).set(data) } catch (e) { console.warn('[Firestore Set Warning]', e.message) }
                    }
                    inMemoryStore.set(key, data)
                    return { id: subDocId }
                  },
                  async get() {
                    if (isInitializedWithCert && realDb) {
                      try { return await realDb.collection(colName).doc(docId).collection(subColName).doc(subDocId).get() } catch (e) { console.warn('[Firestore Get Warning]', e.message) }
                    }
                    const data = inMemoryStore.get(key)
                    return { exists: Boolean(data), data: () => data }
                  }
                }
              }
            }
          },
          async set(data) {
            const key = `${colName}/${docId}`
            if (isInitializedWithCert && realDb) {
              try { return await realDb.collection(colName).doc(docId).set(data) } catch (e) { console.warn('[Firestore Set Warning]', e.message) }
            }
            inMemoryStore.set(key, data)
            return { id: docId }
          },
          async get() {
            const key = `${colName}/${docId}`
            if (isInitializedWithCert && realDb) {
              try { return await realDb.collection(colName).doc(docId).get() } catch (e) { console.warn('[Firestore Get Warning]', e.message) }
            }
            const data = inMemoryStore.get(key)
            return { exists: Boolean(data), data: () => data }
          }
        }
      }
    }
  }
}

const db = isInitializedWithCert && realDb ? realDb : safeDb

module.exports = { admin, db, auth }

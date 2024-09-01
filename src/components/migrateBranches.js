const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, setDoc, deleteDoc, doc } = require('firebase/firestore');

// Your Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyDSsmK57c_LBlFMTEuT88Ilrcu6PAjGvD4",
    authDomain: "renting-wala.firebaseapp.com",
    projectId: "renting-wala",
    storageBucket: "renting-wala.appspot.com",
    messagingSenderId: "180970125349",
    appId: "1:180970125349:web:a204e0c73d0b39a521a7cc",
    measurementId: "G-BLSYY0G1BM"
  
};

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const migrateBranchIds = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'branches'));

    querySnapshot.forEach(async (docSnapshot) => {
      const branchData = docSnapshot.data();
      const branchCode = branchData.branchCode;

      // If the branchCode exists, migrate the document
      if (branchCode) {
        // Set the new document with branchCode as the ID
        await setDoc(doc(db, 'branches', branchCode), branchData);

        // Optionally delete the old document with the auto-generated ID
        await deleteDoc(doc(db, 'branches', docSnapshot.id));

        console.log(`Migrated branch with code: ${branchCode}`);
      }
    });

    console.log('Migration complete');
  } catch (error) {
    console.error('Error during migration:', error);
  }
};

migrateBranchIds();

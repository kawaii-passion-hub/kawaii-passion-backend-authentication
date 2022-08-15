const functions = require("firebase-functions");

// The Firebase Admin SDK to access Realtime Database.
const admin = require("firebase-admin");
admin.initializeApp();

// On sign up.
exports.processSignUp = functions.auth.user().onCreate(async (user, _) => {
  const db = admin.database();
  const whitelisted = await db.ref("users/whitelisted").get();

  // Check if user meets role criteria.
  if (user.email &&
    user.emailVerified &&
    whitelisted.val().includes(user.email)
  ) {
    const customClaims = {
      whitelisted: true,
    };

    try {
      // Set custom user claims on this newly created user.
      await admin.auth().setCustomUserClaims(user.uid, customClaims);

      // Update real-time database to notify client to force refresh.
      const metadataRef = db.ref("metadata/" + user.uid);

      // Set the refresh time to the current UTC timestamp.
      // This will be captured on the client to force a token refresh.
      await metadataRef.set({refreshTime: new Date().getTime()});
    } catch (error) {
      console.log(error);
    }
  }
});

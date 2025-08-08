
import db from '../../backend/db.js';

export async function handler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*', // Allow requests from any origin
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Pre-flight check
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }

  try {
    if (event.httpMethod === 'GET') {
      const userId = event.queryStringParameters.userId || "defaultUser";
      const wellness = await new Promise((resolve, reject) => {
        db.wellness.findOne({ userId }, (err, doc) => {
          if (err) reject(err);
          resolve(doc);
        });
      });

      if (wellness) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(wellness),
        };
      } else {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ spoonCount: 12, mood: 'neutral', userId: userId }),
        };
      }
    }

    if (event.httpMethod === 'POST') {
      const { spoonCount, mood, userId } = JSON.parse(event.body);
      const userIdentifier = userId || "defaultUser";
      const updateDoc = {};
      if (spoonCount !== undefined) updateDoc.spoonCount = spoonCount;
      if (mood !== undefined) updateDoc.mood = mood;

      await new Promise((resolve, reject) => {
        db.wellness.update({ userId: userIdentifier }, { $set: updateDoc }, { upsert: true }, (err) => {
          if (err) reject(err);
          resolve();
        });
      });
      
      const updatedWellness = await new Promise((resolve, reject) => {
          db.wellness.findOne({ userId: userIdentifier }, (err, doc) => {
              if (err) reject(err);
              resolve(doc);
          });
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(updatedWellness),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: 'Method Not Allowed',
    };
  } catch (error) {
    console.error('Wellness function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to process wellness data.' }),
    };
  }
}

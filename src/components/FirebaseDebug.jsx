// FirebaseDebug.jsx
import React, { useState, useEffect } from 'react';
import { db, realtimeDb } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, set, get } from 'firebase/database';

const FirebaseDebug = () => {
  const [status, setStatus] = useState({
    firestore: 'testing...',
    realtimeDb: 'testing...',
    lastTest: null
  });

  const testFirestore = async () => {
    try {
      const testDocRef = doc(db, 'test/connection');
      await setDoc(testDocRef, {
        timestamp: new Date(),
        message: 'Connection test successful'
      });
      
      const testDoc = await getDoc(testDocRef);
      if (testDoc.exists()) {
        return '✅ Connected';
      } else {
        return '❌ Write failed';
      }
    } catch (error) {
      console.error('Firestore test error:', error);
      if (error.code === 'permission-denied') {
        return '🚨 Permission denied - Check Firestore rules';
      } else if (error.code === 'failed-precondition') {
        return '🚨 Firestore not enabled - Enable in console';
      } else if (error.message?.includes('400')) {
        return '🚨 Bad request - Check project setup';
      } else {
        return `❌ Error: ${error.code || error.message}`;
      }
    }
  };

  const testRealtimeDb = async () => {
    try {
      const testRef = ref(realtimeDb, 'test/connection');
      await set(testRef, {
        timestamp: new Date().toISOString(),
        message: 'Connection test successful'
      });
      
      const snapshot = await get(testRef);
      if (snapshot.exists()) {
        return '✅ Connected';
      } else {
        return '❌ Write failed';
      }
    } catch (error) {
      console.error('Realtime DB test error:', error);
      if (error.code === 'PERMISSION_DENIED') {
        return '🚨 Permission denied - Check database rules';
      } else {
        return `❌ Error: ${error.code || error.message}`;
      }
    }
  };

  const runTests = async () => {
    setStatus({
      firestore: 'testing...',
      realtimeDb: 'testing...',
      lastTest: new Date()
    });

    const [firestoreResult, realtimeResult] = await Promise.all([
      testFirestore(),
      testRealtimeDb()
    ]);

    setStatus({
      firestore: firestoreResult,
      realtimeDb: realtimeResult,
      lastTest: new Date()
    });
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'white',
      border: '2px solid #ddd',
      borderRadius: '8px',
      padding: '15px',
      maxWidth: '300px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 10000,
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>
        🔍 Firebase Debug
      </h4>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Firestore:</strong> {status.firestore}
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Realtime DB:</strong> {status.realtimeDb}
      </div>
      
      <div style={{ marginBottom: '10px', fontSize: '10px', color: '#666' }}>
        Last test: {status.lastTest?.toLocaleTimeString()}
      </div>
      
      <button
        onClick={runTests}
        style={{
          background: '#007bff',
          color: 'white',
          border: 'none',
          padding: '5px 10px',
          borderRadius: '4px',
          fontSize: '11px',
          cursor: 'pointer'
        }}
      >
        🔄 Retest
      </button>
      
      <div style={{
        marginTop: '10px',
        fontSize: '10px',
        color: '#666',
        borderTop: '1px solid #eee',
        paddingTop: '8px'
      }}>
        Project: img-prompt-project
      </div>
    </div>
  );
};

export default FirebaseDebug;

// contentAPI.js
import axios from 'axios';

const fetchDailyContent = async () => {
  try {
    // Utilisation de l'API Words pour obtenir des nouveaux mots
    const wordsResponse = await axios.get('https://api.wordnik.com/v4/words.json/wordOfTheDay');
    
    // Utilisation de l'API pour obtenir des textes (exemple avec Lorem Ipsum)
    const textsResponse = await axios.get('https://baconipsum.com/api/?type=all-meat&sentences=3');
    
    return {
      words: wordsResponse.data,
      texts: textsResponse.data
    };
  } catch (error) {
    console.error('Erreur lors de la récupération du contenu:', error);
    return null;
  }
};

// App.js
import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  Animated,
  Platform,
  ScrollView,
  RefreshControl
} from 'react-native';
// ... autres imports précédents ...

function DailyContentScreen({ navigation }) {
  const [dailyContent, setDailyContent] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadDailyContent = async () => {
    try {
      const stored = await AsyncStorage.getItem('dailyContent');
      const storedDate = await AsyncStorage.getItem('lastUpdate');
      
      if (stored && storedDate) {
        const currentDate = new Date().toDateString();
        if (storedDate === currentDate) {
          setDailyContent(JSON.parse(stored));
          setLastUpdate(storedDate);
          return;
        }
      }
      
      // Si le contenu n'existe pas ou date d'hier, on en récupère du nouveau
      const newContent = await fetchDailyContent();
      const currentDate = new Date().toDateString();
      
      await AsyncStorage.setItem('dailyContent', JSON.stringify(newContent));
      await AsyncStorage.setItem('lastUpdate', currentDate);
      
      setDailyContent(newContent);
      setLastUpdate(currentDate);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadDailyContent().then(() => setRefreshing(false));
  }, []);

  useEffect(() => {
    loadDailyContent();
  }, []);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.title}>Contenu du jour</Text>
      <Text style={styles.date}>Mis à jour le: {lastUpdate}</Text>
      
      {dailyContent && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mots du jour</Text>
            {dailyContent.words.map((word, index) => (
              <TouchableOpacity 
                key={index}
                style={styles.wordCard}
                onPress={() => navigation.navigate('Practice', { word })}
              >
                <Text style={styles.wordText}>{word}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Texte du jour</Text>
            <TouchableOpacity 
              style={styles.textCard}
              onPress={() => navigation.navigate('TextPractice', { text: dailyContent.texts[0] })}
            >
              <Text style={styles.textPreview}>{dailyContent.texts[0].substring(0, 100)}...</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
}

// Ajout des nouveaux styles
const styles = StyleSheet.create({
  // ... styles précédents ...
  section: {
    marginVertical: 15,
    padding: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  wordCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginVertical: 5,
    elevation: 2,
  },
  wordText: {
    fontSize: 18,
  },
  textCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginVertical: 5,
    elevation: 2,
  },
  textPreview: {
    fontSize: 16,
    color: '#666',
  },
  date: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
});

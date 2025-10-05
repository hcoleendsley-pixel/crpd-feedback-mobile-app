import React, { useState, useMemo, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Main App Component: Shows the officer list and search
function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOfficer, setSelectedOfficer] = useState(null);

  // Load officers when the app first starts
  useEffect(() => {
    loadOfficers();
  }, []);

  // Memoize the filtered list for better performance
  const filteredOfficers = useMemo(() => {
    if (!searchTerm) return officers;
    return officers.filter(officer => {
      const fullName = `${officer.first_name} ${officer.last_name}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase());
    });
  }, [officers, searchTerm]);

  // Function to load officers from your backend server
  const loadOfficers = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://feedbackend-kqls.onrender.com/api/officers');
      const data = await response.json();
      setOfficers(data);
    } catch (error) {
      Alert.alert('Connection Error', 'Failed to load officers. Please make sure your backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  // If an officer is selected, show the detail screen component
  if (selectedOfficer) {
    return (
      <OfficerDetailScreen
        officer={selectedOfficer}
        onBack={() => setSelectedOfficer(null)}
        onFeedbackSubmitted={() => {
          // After submitting, go back to the list and refresh it
          setSelectedOfficer(null);
          loadOfficers();
        }}
      />
    );
  }

  // Otherwise, show the main officer list screen
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
      <View style={styles.header}>
        <Icon name="local-police" size={28} color="#93c5fd" />
        <Text style={styles.headerTitle}>Community Feedback Portal</Text>
        <Text style={styles.headerSubtitle}>Cedar Rapids Police Department</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.searchSection}>
           <Icon name="search" size={24} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by officer name..."
            placeholderTextColor="#9ca3af"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
        {loading && officers.length === 0 ? (
           <ActivityIndicator size="large" color="#1d4ed8" style={{marginTop: 50}} />
        ) : (
          <FlatList
            data={filteredOfficers}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.officerCard} onPress={() => setSelectedOfficer(item)}>
                <View style={{flex: 1}}>
                  <Text style={styles.officerName}>{`${item.first_name} ${item.last_name}`}</Text>
                  <Text style={styles.officerTitle}>{item.job_title}</Text>
                </View>
                <View style={styles.ratingBadge}>
                    <Icon name="star" size={16} color="#fbbf24" />
                    <Text style={styles.ratingText}>
                        {item.average_rating.toFixed(1)}
                    </Text>
                </View>
                 <Icon name="chevron-right" size={24} color="#9ca3af" />
              </TouchableOpacity>
            )}
            keyExtractor={item => item.id.toString()}
            ListHeaderComponent={<Text style={styles.listHeader}>{`Showing ${filteredOfficers.length} of ${officers.length} officers`}</Text>}
            refreshing={loading}
            onRefresh={loadOfficers}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

// Officer Detail Screen Component: Shows officer info and feedback form
function OfficerDetailScreen({ officer, onBack, onFeedbackSubmitted }) {
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackList, setFeedbackList] = useState([]);
  const [loadingFeedback, setLoadingFeedback] = useState(true);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
        const response = await fetch(`https://feedbackend-kqls.onrender.com/api/officers/${officer.id}/feedback`);
        const data = await response.json();
        setFeedbackList(data);
    } catch (error) {
        Alert.alert('Error', 'Could not load feedback.');
    } finally {
        setLoadingFeedback(false);
    }
  };


  const submitFeedback = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch('https://feedbackend-kqls.onrender.com/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          officer_id: officer.id,
          rating,
          feedback_text: feedbackText,
          is_anonymous: isAnonymous,
        }),
      });
      if (!response.ok) throw new Error('Server responded with an error.');
      
      Alert.alert('Feedback Submitted', 'Thank you for helping improve our community.', [
        { text: 'OK', onPress: onFeedbackSubmitted }
      ]);
    } catch (error) {
      Alert.alert('Submission Error', 'Could not submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
       <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Icon name="arrow-back-ios" size={20} color="white" />
          <Text style={styles.backButtonText}>Back to List</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Officer Profile</Text>
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.detailCard}>
          <Text style={styles.detailName}>{`${officer.first_name} ${officer.last_name}`}</Text>
          <Text style={styles.detailTitle}>{officer.job_title}</Text>
        </View>
        
        <View style={styles.feedbackCard}>
            <Text style={styles.sectionTitle}>Community Feedback Log</Text>
            {loadingFeedback ? (
                <ActivityIndicator size="small" color="#1d4ed8" />
            ) : feedbackList.length === 0 ? (
                <View style={styles.emptyState}>
                    <Icon name="comment" size={24} color="#9ca3af" />
                    <Text style={styles.emptyStateText}>No feedback has been submitted for this officer yet.</Text>
                </View>
            ) : (
                feedbackList.map((fb, index) => (
                    <View key={index} style={styles.feedbackItem}>
                        <View style={styles.feedbackHeader}>
                             <View style={styles.starRating}>
                                {[...Array(5)].map((_, i) => (
                                    <Icon key={i} name="star" size={16} color={i < fb.rating ? '#fbbf24' : '#e5e7eb'} />
                                ))}
                            </View>
                            <Text style={styles.feedbackDate}>{new Date(fb.created_at).toLocaleDateString()}</Text>
                        </View>
                        <Text style={styles.feedbackComment}>{fb.feedback_text || "No comment provided."}</Text>
                    </View>
                ))
            )}
        </View>


        <View style={styles.feedbackCard}>
            <Text style={styles.sectionTitle}>Submit Your Feedback</Text>
            <Text style={styles.sectionSubtitle}>1. Rate Your Interaction</Text>
            <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setRating(star)}>
                         <Icon name={star <= rating ? "star" : "star-border"} size={40} color={star <= rating ? '#fbbf24' : '#cbd5e1'} />
                    </TouchableOpacity>
                ))}
            </View>
        </View>

        <View style={styles.feedbackCard}>
          <Text style={styles.sectionSubtitle}>2. Describe Your Experience (Optional)</Text>
          <TextInput
            style={styles.feedbackInput}
            placeholder="Provide details about the interaction..."
            placeholderTextColor="#9ca3af"
            multiline
            value={feedbackText}
            onChangeText={setFeedbackText}
          />
        </View>

        <View style={styles.feedbackCard}>
            <Text style={styles.sectionSubtitle}>3. Submission Preference</Text>
            <TouchableOpacity style={styles.checkboxContainer} onPress={() => setIsAnonymous(!isAnonymous)}>
                <Icon name={isAnonymous ? "check-box" : "check-box-outline-blank"} size={28} color={isAnonymous ? '#1d4ed8' : '#9ca3af'} />
                <Text style={styles.checkboxLabel}>Submit Anonymously</Text>
            </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.submitButton, submitting && styles.disabledButton]} onPress={submitFeedback} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : 
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Icon name="send" size={20} color="white" style={{marginRight: 8}} />
            <Text style={styles.buttonText}>Submit Feedback</Text>
          </View>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Containers & Layout
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { flex: 1, paddingHorizontal: 16 },
  header: { backgroundColor: '#1e3a8a', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1e40af', alignItems: 'center' },

  // Typography
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: 'white', textAlign: 'center' },
  headerSubtitle: { fontSize: 14, color: '#93c5fd', textAlign: 'center', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e2937', marginBottom: 12 },
  sectionSubtitle: { fontSize: 16, fontWeight: '600', color: '#1e2937', marginBottom: 12 },
  listHeader: { color: '#475569', paddingVertical: 8, fontWeight: '500' },

  // Buttons
  submitButton: { backgroundColor: '#16a34a', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, flexDirection: 'row', justifyContent: 'center' },
  disabledButton: { backgroundColor: '#9ca3af' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  backButton: { position: 'absolute', left: 16, top: 16, zIndex: 1, flexDirection: 'row', alignItems: 'center' },
  backButtonText: { color: 'white', fontSize: 16, marginLeft: 6 },

  // Search & Inputs
  searchSection: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, marginVertical: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  searchIcon: { paddingLeft: 12 },
  searchInput: { flex: 1, padding: 14, fontSize: 16, color: '#1e2937' },
  feedbackInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 16, minHeight: 100, textAlignVertical: 'top' },
  
  // Officer List Cards
  officerCard: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', elevation: 1 },
  officerName: { fontSize: 16, fontWeight: '600', color: '#1e2937' },
  officerTitle: { fontSize: 14, color: '#64748b' },
  
  // Rating Badge on List
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fefce8', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginRight: 8, borderWidth: 1, borderColor: '#fde047' },
  ratingText: { color: '#a16207', fontWeight: 'bold', fontSize: 14, marginLeft: 4 },

  // Detail Screen Cards
  detailCard: { backgroundColor: 'white', padding: 20, borderRadius: 12, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  detailName: { fontSize: 24, fontWeight: 'bold', color: '#1e2937' },
  detailTitle: { fontSize: 16, color: '#475569', marginTop: 4 },
  feedbackCard: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },

  // Feedback display
  emptyState: { alignItems: 'center', paddingVertical: 20 },
  emptyStateText: { marginTop: 8, color: '#64748b' },
  feedbackItem: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingVertical: 12},
  feedbackHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  starRating: { flexDirection: 'row' },
  feedbackComment: { fontSize: 14, color: '#334155', fontStyle: 'italic', marginVertical: 4},
  feedbackDate: { fontSize: 12, color: '#94a3b8' },


  // Rating Stars
  starsContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },

  // Checkbox
  checkboxContainer: { flexDirection: 'row', alignItems: 'center' },
  checkboxLabel: { fontSize: 16, color: '#334155', marginLeft: 10 },
});

export default App;
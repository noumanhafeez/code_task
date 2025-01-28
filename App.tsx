import React, {useEffect, useState} from 'react';
import {
  TouchableOpacity,
  Text,
  Modal,
  View,
  StyleSheet,
  TextInput,
  FlatList,
  Dimensions,
  Alert,
} from 'react-native';
import sqlite from 'react-native-sqlite-storage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
const {width} = Dimensions.get('window');

const App = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [data, setData] = useState([]);
  const [error, setError] = useState(''); // Error state for phone number duplication
  // Create the database
  let db = sqlite.openDatabase({name: 'usersData.db'});

  // Check if the form is complete (both name and phone are filled)
  const canSave = name && phone;

  // Create a table in usersData.db database
  useEffect(() => {
    db.transaction(tx => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR(20), phone VARCHAR(20))',
      );
      // Debugging purpose
      console.log('Table created');
    });
    // Fetch the data from the database
    fetchData();

    // Cleanup function to close the database
    return () => {
      db.close(
        () => {
          // Debugging purpose
          console.log('Database closed');
        },
        err => {
          console.error('Failed to close the database:', err);
        },
      );
    };
  }, []);

  // Save the data to the database
  const saveData = () => {
    db.transaction(tx => {
      // Check if the phone number already exists in the database
      tx.executeSql(
        'SELECT * FROM users WHERE phone = ?',
        [phone],
        (tx, res) => {
          if (res.rows.length > 0) {
            // Phone number exists
            setError('Phone number already exists!'); // Set error message
          } else {
            // Phone number does not exist, proceed to insert
            tx.executeSql(
              'INSERT INTO users (name, phone) VALUES (?, ?)',
              [name, phone],
              (tx, res) => {
                console.log('Results', res);
                if (res.rowsAffected === 1) {
                  Alert.alert('Success', 'Data saved successfully');
                  setName(''); // Clear the input fields
                  setPhone('');
                  setError(''); // Clear error message
                  setModalVisible(false);
                  fetchData(); // Fetch data from database automatically when click on save button
                } else {
                  Alert.alert(
                    'Failed',
                    'Failed to save data. Please try again',
                  );
                }
              },
            );
          }
        },
      );
    });
  };

  // Fetch the data from the database
  const fetchData = () => {
    db.transaction(tx => {
      tx.executeSql('SELECT * FROM users', [], (tx, res) => {
        let list = [];
        for (let i = 0; i < res.rows.length; i++) {
          list.push(res.rows.item(i));
        }
        setData(list); // Update state with the new data
      });
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <TouchableOpacity
          style={styles.iconStyle}
          onPress={() => setModalVisible(true)}>
          <MaterialIcons name="add" size={40} color="black" />
        </TouchableOpacity>
      </View>

      {/* Modal for showing content */}
      {modalVisible && (
        <Modal animationType="slide" transparent={true} visible={modalVisible}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TextInput
                style={styles.inputStyle}
                placeholder="Full Name"
                placeholderTextColor="#888" // For android case: set placeholder text color
                value={name}
                onChangeText={setName}
              />
              <TextInput
                style={styles.inputStyle}
                placeholder="Phone Number"
                placeholderTextColor="#888" // For android case: set placeholder text color
                keyboardType="numeric"
                value={phone}
                onChangeText={setPhone}
              />

              {/*  Display error message if phone number already exists */}
              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                onPress={() => {
                  if (canSave) {
                    saveData();
                  }
                }}
                style={[
                  styles.saveButton,
                  {backgroundColor: canSave ? 'green' : '#ccc'},
                ]}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Display the data in a FlatList */}
      <View style={styles.flatListContainer}>
        <FlatList
          data={data}
          renderItem={({item}) => (
            <View style={styles.listItem}>
              <Text style={styles.listItemText}>Name: {item.name}</Text>
              <Text style={styles.listItemText}>Phone No: {item.phone}</Text>
            </View>
          )}
          contentContainerStyle={{paddingBottom: 80}} // To ensure some padding at the bottom
          showsVerticalScrollIndicator={false} // Hide the vertical scroll bar
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  iconContainer: {
    margin: 20,
    top: 50,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  iconStyle: {
    backgroundColor: '#f9f9f9',
    shadowColor: 'black',
    shadowOffset: {width: 3, height: 3},
    shadowOpacity: 0.5,
    elevation: 5,
    padding: 10,
    borderRadius: 50,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
  },
  inputStyle: {
    borderWidth: 0.2,
    width: 250,
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  saveButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
  },
  flatListContainer: {
    flex: 1,
    marginTop: 50,
  },
  listItem: {
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    marginVertical: 10,
    left: 10,
    elevation: 30,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.6,
    shadowRadius: 4,
    width: width - 40, // Set the width of the list item to the screen width minus 40
  },
  listItemText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
});

export default App;

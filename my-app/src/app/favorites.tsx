import React from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProductStore } from './stores/useProductStore';

export default function FavoritesScreen() {
  const products = useProductStore((state) => state.products);
  const toggleFavorite = useProductStore((state) => state.toggleFavorite);
  const [searchQuery, setSearchQuery] = React.useState('');
  const favoriteProducts = products.filter((product) => product.isFavorite);
  const filteredProducts = favoriteProducts.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityLabel="Volver a productos"
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Image
          source={require('../../assets/logo.jpg')}
          style={styles.logo}
        />
        <TouchableOpacity
          accessibilityLabel="Carrito de compras"
          style={styles.headerButton}
          onPress={() => router.push('/checkout')}
        >
            <Image
              source={require('../../assets/carro.png')}
              style={styles.cartImage}
            />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Favoritos</Text>

      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          placeholder="Buscar..."
          placeholderTextColor="#333333"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
      </View>

      {filteredProducts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>♡</Text>
          <Text style={styles.emptyTitle}>
            {favoriteProducts.length === 0 ? 'No tienes favoritos' : 'Sin resultados'}
          </Text>
          <Text style={styles.emptyText}>
            {favoriteProducts.length === 0
              ? 'Presiona el corazón de un producto para agregarlo aquí.'
              : 'Prueba con otro nombre de producto.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>PRODUCTO</Text>
              <Text style={styles.tableHeaderText}>DESCRIPCIÓN</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.favoriteRow}>
              <Image source={{ uri: item.image }} style={styles.productImage} />
              <View style={styles.productInfo}>
                <Text style={styles.category}>{item.category}</Text>
                <Text style={styles.productName} numberOfLines={1}>
                  {item.name}
                </Text>
              </View>
              <TouchableOpacity
                accessibilityLabel={`Quitar ${item.name} de favoritos`}
                onPress={() => toggleFavorite(item.id)}
                style={styles.deleteButton}
              >
                  <Image
                    source={require('../../assets/basurero_amarillo.png')}
                    style={styles.deleteImage}
                  />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 2,
  },
  headerButton: {
    width: 42,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  menuIcon: {
    color: '#E47B1B',
    fontSize: 27,
  },
  cartImage: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  title: {
    color: '#1C1C1E',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 27,
  },
  logo: {
    width: 52,
    height: 52,
    resizeMode: 'contain',
  },
  searchContainer: {
    height: 46,
    marginHorizontal: 39,
    marginBottom: 44,
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: '#D9D9D9',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    color: '#1C1C1E',
    fontSize: 29,
    lineHeight: 29,
    marginRight: 8,
    transform: [{ rotate: '-20deg' }],
  },
  searchInput: {
    flex: 1,
    color: '#1C1C1E',
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 24,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 17,
    marginBottom: 17,
  },
  tableHeaderText: {
    width: '34%',
    color: '#1C1C1E',
    fontSize: 12,
    fontWeight: '500',
  },
  favoriteRow: {
    minHeight: 102,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 17,
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  productImage: {
    width: 85,
    height: 85,
    borderRadius: 8,
    backgroundColor: '#EEEEEE',
  },
  productInfo: {
    flex: 1,
    paddingLeft: 39,
    paddingRight: 8,
  },
  category: {
    color: '#969696',
    fontSize: 12,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  productName: {
    color: '#1C1C1E',
    fontSize: 15,
    marginBottom: 5,
  },
  deleteButton: {
    width: 28,
    alignItems: 'center',
  },
  deleteImage: {
    width: 26,
    height: 26,
    resizeMode: 'contain',
  },
  deleteIcon: {
    color: '#E8751A',
    fontSize: 25,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    color: '#C87D0E',
    fontSize: 64,
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#1C1C1E',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: 16,
    textAlign: 'center',
  },
});

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Image,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProductCard } from '../components/ProductCard'
import { useProductStore } from '../stores/useProductStore';
import { CategoryType } from '../types/product';

export default function ProductsScreen() {
  const products = useProductStore((state) => state.products);
  const cartCount = useProductStore((state) => state.cart.length);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('platillo');
  const [searchQuery, setSearchQuery] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);

  //filtracion d productos
  const filteredProducts = products.filter((item) => {
    const matchesCategory = item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  const categories: { label: string; key: CategoryType }[] = [
    { label: 'Platillo', key: 'platillo' },
    { label: 'Bebida', key: 'bebida' },
    { label: 'Snack', key: 'snack' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                accessibilityLabel="Abrir menú de navegación"
                onPress={() => setMenuVisible(true)}
                style={styles.iconButton}
              >
                <Text style={styles.iconText}>☰</Text>
              </TouchableOpacity>
              <Image
                source={require('../../../assets/buster.png')} //logo
                style={styles.logoImage}
              />
              <TouchableOpacity
                accessibilityLabel="Abrir carrito de compras"
                onPress={() => router.push('/checkout')}
                style={styles.cartButton}
              >
                <Image
                  source={require("../../../assets/carro.png")}
                  style={styles.carro}
                />
                {cartCount > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{cartCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* headline */}
            <Text style={styles.headline}>Un buen día empieza{'\n'}con Buster’s</Text>

            {/* barra de busqueda */}
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

            {/* tabs d filtrado d categorias */}
            <View style={styles.categoryContainer}>
              {categories.map((cat) => {
                const isActive = selectedCategory === cat.key;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    style={isActive ? styles.activeTab : styles.inactiveTab}
                    onPress={() => setSelectedCategory(cat.key)}
                  >
                    <Text style={isActive ? styles.activeTabText : styles.inactiveTabText}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        }
        renderItem={({ item }) => <ProductCard product={item} />}
      />

      {menuVisible && (
        <View style={styles.menuOverlay}>
          <View style={styles.menuPanel}>
            <Text style={styles.menuTitle}>Menú</Text>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setMenuVisible(false)}
            >
              <Text style={styles.menuItemText}>Productos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                router.push('/favorites');
              }}
            >
              <Text style={styles.menuItemText}>Favoritos</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            accessibilityLabel="Cerrar menú"
            style={styles.menuBackdrop}
            onPress={() => setMenuVisible(false)}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', //fondo blanco de la app
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconText: { //barra de hamburguesa
    fontSize: 24,
    color: '#C87D0E',
  },
  iconButton: {
    padding: 8,
  },
  logoImage: { //logo d perro
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  carro: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  cartButton: {
    position: 'relative',
    padding: 5,
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: '#E0245E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  headline: { //texto d un buen dia empieza con busters estilo
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1C1C1E',
  },
  searchContainer: {
    height: 46,
    marginHorizontal: 24,
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
  categoryContainer: { //categorias platico-bebida-snak contenedor
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#C87D0E', //linea d abajo del tab activo
    paddingBottom: 5,
  },
  activeTabText: { //texto del tab activo
    fontWeight: 'bold',
    color: '#C87D0E',
    fontSize: 18,
  },
  inactiveTab: {
    paddingBottom: 5,
  },
  inactiveTabText: { //texto inactivo 
    fontWeight: '600',
    color: '#8E8E93',
    fontSize: 18,
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    flexDirection: 'row',
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  menuPanel: {
    width: 260,
    paddingTop: 56,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    elevation: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  menuTitle: {
    marginBottom: 24,
    color: '#C87D0E',
    fontSize: 24,
    fontWeight: 'bold',
  },
  menuItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  menuItemText: {
    color: '#1C1C1E',
    fontSize: 17,
    fontWeight: '600',
  },
});
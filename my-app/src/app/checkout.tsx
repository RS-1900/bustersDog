import {
	FlatList,
	Image,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProductStore } from './stores/useProductStore';

const TAX_RATE = 0.01;

export default function CheckoutScreen() {
	const cart = useProductStore((state) => state.cart);
	const removeFromCart = useProductStore((state) => state.removeFromCart);
	const subtotal = cart.reduce((total, product) => total + product.cartPrice * product.quantity, 0);
	const taxes = subtotal * TAX_RATE;
	const total = subtotal + taxes;

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.header}>
				<TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
					<Text style={styles.backText}>‹</Text>
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Checkout</Text>
			</View>
			<View style={styles.paymentRow}>
				<Text style={styles.rowLabel}>MÉTODO DE PAGO</Text>
				<Text style={styles.rowValue}>Elija un método de pago</Text>
			</View>
			<View style={styles.tableHeader}>
				<Text style={styles.columnProduct}>ALIMENTO</Text>
				<Text style={styles.columnDescription}>DESCRIPCIÓN</Text>
				<Text style={styles.columnPrice}>PRECIO</Text>
			</View>
			<FlatList
				data={cart}
				keyExtractor={(item, index) => `${item.id}-${index}`}
				contentContainerStyle={styles.listContent}
				ListEmptyComponent={<Text style={styles.emptyText}>No hay productos en el carrito.</Text>}
				renderItem={({ item, index }) => (
					<View style={styles.productRow}>
						<Image source={{ uri: item.image }} style={styles.productImage} />
						<View style={styles.productInfo}>
							<Text style={styles.category}>{item.category}</Text>
							<Text style={styles.productName}>{item.name}</Text>
														<Text style={styles.quantity}>
															Cantidad: {String(item.quantity).padStart(2, '0')}{item.selectedSize ? ` | Tamaño: ${item.selectedSize}` : ''}
														</Text>
						</View>
						<View style={styles.productActions}>
							<Text style={styles.productPrice}>${item.cartPrice.toFixed(2)}</Text>
							<TouchableOpacity
								accessibilityLabel={`Eliminar ${item.name} del carrito`}
								style={styles.removeButton}
								onPress={() => removeFromCart(index)}
							>
								<Image
									source={require('../../assets/basurero_amarillo.png')}
									style={styles.removeIcon}
								/>
							</TouchableOpacity>
						</View>
					</View>
				)}
			/>
			<View style={styles.summary}>
				<View style={styles.summaryRow}>
					<Text>Subtotal ({cart.reduce((count, item) => count + item.quantity, 0)})</Text>
					<Text>${subtotal.toFixed(2)}</Text>
				</View>
				<View style={styles.summaryRow}>
					<Text>Impuestos</Text>
					<Text>${taxes.toFixed(2)}</Text>
				</View>
				<View style={styles.summaryRow}>
					<Text style={styles.totalLabel}>Total</Text>
					<Text style={styles.totalLabel}>${total.toFixed(2)}</Text>
				</View>
				<View style={styles.scheduleRow}>
					<Text>Programar pedido</Text>
					<Text style={styles.chevron}>›</Text>
				</View>
			</View>
			<View style={styles.orderArea}>
				<View style={styles.disabledScheduleDot} />
				<TouchableOpacity style={styles.orderButton}>
					<Text style={styles.orderText}>Ordenar</Text>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#FFFFFF' },
	header: {
		height: 64,
		backgroundColor: '#D68A2B',
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		position: 'relative',
	},
	backButton: {
		width: 32,
		zIndex: 1,
	},
	backText: { color: '#FFFFFF', fontSize: 32, lineHeight: 32 },
	headerTitle: {
		color: '#000000',
		fontSize: 16,
		fontWeight: '700',
		flex: 1,
		textAlign: 'center',
		marginRight: 32,
	},
	paymentRow: {
		height: 52,
		borderBottomWidth: 1,
		borderBottomColor: '#EEEEEE',
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 14,
		gap: 34,
	},
	rowLabel: { color: '#222222', fontSize: 11, width: 82 },
	rowValue: { color: '#222222', fontSize: 12 },
	tableHeader: {
		flexDirection: 'row',
		paddingHorizontal: 14,
		paddingTop: 16,
		paddingBottom: 8,
	},
	columnProduct: { flex: 1, color: '#222222', fontSize: 11 },
	columnDescription: { flex: 1.5, color: '#222222', fontSize: 11 },
	columnPrice: { width: 64, color: '#222222', fontSize: 11, textAlign: 'center' },
	listContent: { paddingHorizontal: 14, paddingBottom: 10, flexGrow: 1 },
	productRow: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 92 },
	productImage: { width: 72, height: 72, borderRadius: 8 },
	productInfo: { flex: 1, paddingLeft: 22 },
	category: { color: '#999999', fontSize: 11, marginBottom: 4 },
	productName: { color: '#222222', fontSize: 13, marginBottom: 5 },
	quantity: { color: '#222222', fontSize: 12 },
	productActions: {
		width: 64,
		alignItems: 'center',
		justifyContent: 'center',
	},
	productPrice: { color: '#222222', fontSize: 12, textAlign: 'center', marginBottom: 4 },
	removeButton: {
		width: 36,
		height: 42,
		alignItems: 'center',
		justifyContent: 'center',
	},
	removeIcon: { width: 26, height: 26, resizeMode: 'contain' },
	emptyText: { color: '#777777', fontSize: 14, textAlign: 'center', marginTop: 30 },
	summary: { paddingHorizontal: 14, paddingBottom: 10 },
	summaryRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 9,
	},
	totalLabel: { fontWeight: '600' },
	scheduleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
	chevron: { color: '#E28B22', fontSize: 24, marginLeft: 8 },
	orderArea: {
		backgroundColor: '#EEEEEE',
		paddingHorizontal: 14,
		paddingVertical: 10,
	},
	disabledScheduleDot: {
		width: 17,
		height: 17,
		borderRadius: 9,
		backgroundColor: '#F3F3F3',
		marginBottom: 8,
	},
	orderButton: {
		height: 44,
		borderRadius: 7,
		backgroundColor: '#E28B22',
		alignItems: 'center',
		justifyContent: 'center',
	},
	orderText: { color: '#FFFFFF', fontSize: 14 },
});
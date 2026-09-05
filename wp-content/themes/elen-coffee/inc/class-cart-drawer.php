<?php
/**
 * Cart drawer markup + trigger. Uses WooCommerce's native cart object and
 * AJAX fragments (see ELEN_WooCommerce::cart_fragments) — no separate
 * cart state/JS library.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class ELEN_Cart_Drawer {

	public static function init() {
		add_action( 'wp_footer', array( __CLASS__, 'render' ) );
	}

	public static function render() {
		if ( is_admin() || ! function_exists( 'WC' ) ) {
			return;
		}
		?>
		<div class="mini-cart-drawer" id="mini-cart-drawer" role="dialog" aria-modal="true" aria-label="<?php esc_attr_e( 'Your cart', 'elen-coffee' ); ?>" hidden>
			<div class="mini-cart-drawer__backdrop" data-cart-close></div>
			<div class="mini-cart-drawer__panel">
				<header class="mini-cart-drawer__header">
					<h2><?php esc_html_e( 'Your Cart', 'elen-coffee' ); ?></h2>
					<button type="button" class="mini-cart-drawer__close" data-cart-close aria-label="<?php esc_attr_e( 'Close cart', 'elen-coffee' ); ?>">&times;</button>
				</header>
				<div class="mini-cart-drawer__body">
					<?php wc_get_template( 'cart/mini-cart.php' ); ?>
				</div>
			</div>
		</div>
		<?php
	}
}

ELEN_Cart_Drawer::init();

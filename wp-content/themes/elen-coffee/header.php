<?php
/**
 * Header: skip link, primary nav, cart trigger. Mobile nav toggle is
 * progressive-enhancement only (works without JS as a normal in-page menu).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?><!DOCTYPE html>
<html <?php language_attributes(); ?> class="no-js">
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="theme-color" content="#2b2620">
	<script>document.documentElement.classList.replace('no-js','js');</script>
	<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<a class="skip-link screen-reader-text" href="#primary"><?php esc_html_e( 'Skip to content', 'elen-coffee' ); ?></a>

<header class="site-header" id="site-header">
	<div class="site-header__inner container">
		<button type="button" class="site-header__menu-toggle" aria-controls="primary-menu" aria-expanded="false">
			<span class="sr-only"><?php esc_html_e( 'Menu', 'elen-coffee' ); ?></span>
			<span class="hamburger" aria-hidden="true"></span>
		</button>

		<a class="site-header__logo" href="<?php echo esc_url( home_url( '/' ) ); ?>">
			<?php bloginfo( 'name' ); ?>
		</a>

		<nav class="site-nav" id="primary-menu" aria-label="<?php esc_attr_e( 'Primary', 'elen-coffee' ); ?>">
			<?php
			wp_nav_menu(
				array(
					'theme_location' => 'primary',
					'container'      => false,
					'menu_class'     => 'site-nav__list',
					'fallback_cb'    => 'elen_header_fallback_menu',
				)
			);
			?>
		</nav>

		<div class="site-header__actions">
			<?php if ( class_exists( 'WooCommerce' ) ) : ?>
				<a class="site-header__icon-link" href="<?php echo esc_url( wc_get_account_url() ); ?>" aria-label="<?php esc_attr_e( 'Account', 'elen-coffee' ); ?>">
					<?php echo elen_icon( 'user' ); ?>
				</a>
				<button type="button" class="site-header__icon-link cart-drawer-trigger" data-cart-open aria-controls="mini-cart-drawer" aria-label="<?php esc_attr_e( 'Open cart', 'elen-coffee' ); ?>">
					<?php echo elen_icon( 'bag' ); ?>
					<span class="cart-drawer-trigger__count"><?php echo function_exists( 'WC' ) ? absint( WC()->cart->get_cart_contents_count() ) : 0; ?></span>
				</button>
			<?php endif; ?>
		</div>
	</div>
</header>


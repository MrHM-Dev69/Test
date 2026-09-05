<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
get_header();
?>
<main id="primary" class="site-main container error-404-page">
	<div class="empty-state empty-state--large">
		<p class="empty-state__eyebrow">404</p>
		<h1 class="empty-state__title"><?php esc_html_e( 'This page has gone off to brew.', 'elen-coffee' ); ?></h1>
		<p class="empty-state__text"><?php esc_html_e( "The page you're looking for doesn't exist or has moved.", 'elen-coffee' ); ?></p>
		<div class="empty-state__actions">
			<a class="btn btn--primary" href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Back to home', 'elen-coffee' ); ?></a>
			<?php if ( function_exists( 'wc_get_page_id' ) ) : ?>
				<a class="btn btn--secondary" href="<?php echo esc_url( get_permalink( wc_get_page_id( 'shop' ) ) ); ?>"><?php esc_html_e( 'Shop coffee', 'elen-coffee' ); ?></a>
			<?php endif; ?>
		</div>
		<?php get_search_form(); ?>
	</div>
</main>
<?php
get_footer();

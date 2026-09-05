<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
get_header();
?>
<main id="primary" class="site-main container">
	<h1 class="page-title">
		<?php printf( esc_html__( 'Search results for: %s', 'elen-coffee' ), '<span>' . esc_html( get_search_query() ) . '</span>' ); ?>
	</h1>

	<?php if ( have_posts() ) : ?>
		<div class="post-grid">
			<?php
			while ( have_posts() ) :
				the_post();
				?>
				<article <?php post_class( 'post-card' ); ?> id="post-<?php the_ID(); ?>">
					<h2 class="post-card__title"><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
					<div class="post-card__excerpt"><?php the_excerpt(); ?></div>
				</article>
				<?php
			endwhile;
			?>
		</div>
		<?php the_posts_pagination(); ?>
	<?php else : ?>
		<?php get_template_part( 'template-parts/empty-state', 'search' ); ?>
	<?php endif; ?>
</main>
<?php
get_footer();

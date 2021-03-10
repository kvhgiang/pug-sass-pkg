// https://ckeditor.com/docs/ckeditor5/latest/builds/guides/integration/basic-api.html#example-classic-editor
let ckEditor = document.querySelector( '#ckEditor' );
if ( ckEditor ) {
  ClassicEditor
    .create( ckEditor )
    .catch( error => {
        console.error( error );
    } );
}
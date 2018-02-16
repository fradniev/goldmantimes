$( document ).ready(function() {
	$(".upload-inner").click(function(event) {
		if (!$("#upload-new").hasClass('show')) {
    		$("#upload-new").removeClass('hidden');
    		$("#upload-new").addClass('show');
		}
		else{
    		$("#upload-new").removeClass('show');
    		$("#upload-new").addClass('hidden');
		}
	});
	$(".edit-inner").click(function(event) {
		if (!$("#upload-edit").hasClass('show')) {
    		$("#upload-edit").removeClass('hidden');
    		$("#upload-edit").addClass('show');
		}
		else{
    		$("#upload-edit").removeClass('show');
    		$("#upload-edit").addClass('hidden');
		}
	});
	$("#save-button").click(function(event) {
		var link=$("#new-link").val();
		$.post('/save', {link: link}).done(function(){
			window.location = '/';
		});
		
	});
	$(".delete-inner").click(function(event) {
		var filename=$(this).attr("data-filename");
		$.post('/delete', {filename: filename}, function(){
			window.location = '/';
		});
		
	});
	$(document).on("click","#save-button-edit",function(event) {
		var link=$("#edit-link").val();
		var filename=$("#filename").text().trim();
		$.post('/edit', {link: link, filename:filename}, function(){
			window.location = '/';
		});
		
	});
});
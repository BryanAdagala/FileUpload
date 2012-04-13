<?php
	//file_put_contents("save.txt", var_dump($_FILES))
	
	ini_set("max_input_time", 60 * 5);
	ini_set("max_execution_time", 60 * 5);
	ini_set("upload_max_filesize", 1024 * 1024 * 10);
	
	$path = "files/" . basename($_FILES["file"]["name"]);

	if(move_uploaded_file($_FILES["file"]["tmp_name"], $path)){
		echo '{"result": true, "path": "'.$path.'"}';
	}else{
		echo '{"result": false}';
	}
?>
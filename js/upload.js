function FileUploader(o){
	o = extend({
		parent: "body",
		url: "",
		maxSize: 1024 * 1024 * 10,
		supported: function(){}
	}, o);

	var fileUpload = new FileUpload({
		parent: o.parent,
		maxSize: o.maxSize,
		url: o.url,
		success: function(e){
			filelist.success(e);
		},
		error: function(e){
			filelist.error(e);
		},
		progress: function(e){
			filelist.update(e);
		},
		sizelimit: function(e){
			filelist.error(e);
		},
		ready: function(el){
			el.innerHTML = "Drop Files here";
		},
		over: function(el){
			el.style.backgroundColor = "#4488f5";
			el.style.color = "#eee";
			el.style.borderColor = "#333";
		},
		leave: function(el){
			el.style.backgroundColor = "#333";
			el.style.color = "#eee";
			el.style.borderColor = "#4488f5";
		},
		drop: function(e){
			filelist.add(e);
		}
	});

	var filelist = new FileList({
		parent: o.parent
	});

	var supported = filelist.supported() && fileUpload.supported();

	if(!supported){
		fileUpload.getContext().innerHTML = "Drag and Drop File-Upload is not supported by your browser";
	}

	o.supported(supported);	

	return {

	};
}

function FileUpload(o){

	o = extend({
		success: function(){},
		error: function(){},
		progress: function(){},
		ready: function(){},
		over: function(){},
		leave: function(){},
		drop: function(){},
		sizelimit: function(){},
		parent: "body",
		maxSize: 1024 * 1024 * 10,
		url: "",
		supported: function(){}
	}, o);

	var upload = new Upload({
		url: o.url
	});

	var droparea = new Droparea({
		over: function(e){
			o.over(e.self);
		},
		leave: function(e){
			o.leave(e.self);
		},
		drop: function(e){
			o.leave(e.self);

			for(var i = 0, l = e.dataTransfer.files.length; i < l; i++){
				var file = e.dataTransfer.files[i];
				var id = "" + Date.now() + i;

				file = {
					name: file.name,
					size: file.size,
					type: file.type,
					file: file,
					id: id,
					self: e.self
				};

				o.drop(file);

				if(file.size < o.maxSize){
					upload.send({
						file: file.file,
						id: file.id,
						success: function(e){
							o.success(e);
						},
						error: function(id){
							o.error({
								id: id
							});
						},
						progress: function(e){
							o.progress(e);
						}
					});
				}else{
					o.sizelimit(file);
				}
			}
		},
		ready: function(e){
			o.ready(e.self);
		}
	});

	o.supported(upload.supported() && droparea.supported() && typeof window.FileList != "undefined");

	return {
		supported: function(){
			return upload.supported() && droparea.supported() && typeof window.FileList != "undefined";
		},
		getContext: function(){
			return droparea.getContext();
		}
	};
}

function Upload(o){

	o = extend({
		url: "",
		supported: function(){}
	}, o);

	var supported = typeof window.FormData != "undefined" && typeof new window.XMLHttpRequest().upload != "undefined";

	o.supported(supported);

	return {
		send: function(file){
			file = extend({
				url: o.url,
				file: "",
				success: function(){},
				error: function(){},
				progress: function(){},
				id: null
			}, file);

			ajax({
				url: file.url,
				type: "POST",
				dataType: "json",
				data: {
					file: file.file
				},
				id: file.id,
				success: function(e){
					if(typeof e.data.result != "undefined" && e.data.result === true && typeof e.data.path != "undefined"){
						file.success({
							path: e.data.path,
							id: file.id
						});
					}else{
						file.error(file.id);
					}
				},
				error: function(){
					file.error(file.id);
				},
				progress: function(e){
					file.progress(e);
				}
			});
		},
		supported: function(){
			return supported;
		}
	}
}

function Droparea(o){

	o = extend({
		over: function(){},
		leave: function(){},
		drop: function(){},
		ready: function(){},
		parent: "body",
		supported: function(){}
	}, o);

	var droparea = document.createElement("div");
	droparea.setAttribute("class", "droparea");

	droparea.addEventListener("dragover", function(e){
		if(e.stopPropagation){
			e.stopPropagation();
		}
		if(e.preventDefault){
			e.preventDefault();
		}

		e.self = this;
		o.over(e);

		return false;
	}, false);
	droparea.addEventListener("dragleave", function(e){
		if(e.stopPropagation){
			e.stopPropagation();
		}
		if(e.preventDefault){
			e.preventDefault();
		}

		e.self = this;
		o.leave(e);

		return false;
	}, false);
	droparea.addEventListener("dragexit", function(e){
		if(e.stopPropagation){
			e.stopPropagation();
		}
		if(e.preventDefault){
			e.preventDefault();
		}

		e.self = this;
		o.leave(e);

		return false;
	}, false);
	droparea.addEventListener("drop", function(e){
		if(e.stopPropagation){
			e.stopPropagation();
		}
		if(e.preventDefault){
			e.preventDefault();
		}

		e.self = this;
		o.drop(e);

		return false;
	}, false);

	if(typeof o.parent == "string"){
		o.parent = document.querySelector(o.parent);
	}

	o.parent.appendChild(droparea);

	o.ready({
		self: droparea
	});

	o.supported(true);

	return {
		supported: function(){
			return true;
		},
		getContext: function(){
			return droparea;
		}
	};
}

function FileList(o){

	o = extend({
		parent: "body",
		maxChar: 29,
		width: 100,
		height: 60,
		supported: function(){}
	}, o);

	var thumbnail = new Thumbnail();
	var filename = new Filename();
	var filelist = [];

	var list = document.createElement("ul");
	list.setAttribute("class", "filelist");

	document.querySelector(o.parent).appendChild(list);

	var addToList = function(file){
		var el = document.createElement("li");

		var name = filename.adapt({
			name: file.name,
			maxChar: o.maxChar
		});
		el.innerHTML = "<div class=\"filedocument\"></div><span class=\"filename\">" + name + "</span>";
		el.setAttribute("data-id", file.id);

		el.style.color = "#999";

		filelist[file.id].progress = new ProgressBar({
			parent: el,
			width: 130,
			height: 4,
			maxValue: file.size
		});

		filelist[file.id].element = el;
		list.appendChild(el);
	};

	var addDocument = function(parent){
		var el = document.createElement("span");
		el.setAttribute("class", "document");

		parent.querySelector(".filedocument").appendChild(el);
	};

	o.supported(thumbnail.supported());

	return {
		add: function(file){
			filelist[file.id] = {
				name: file.name,
				size: file.size,
				type: file.type,
				complete: false,
				thumbnail: false,
				thumbnailready: false
			};

			addToList(file);

			if(file.type.match(/image/)){
				filelist[file.id].thumbnail = true;

				thumbnail.create({
					width: o.width,
					height: o.height,
					image: file.file,
					success: function(image){
						image.setAttribute("class", "thumbnail");
						image.style.opacity = filelist[file.id].complete ? 1 : .5;
						image.style.marginTop = "3px";
						filelist[file.id].element.querySelector(".filedocument").appendChild(image);
						filelist[file.id].element.querySelector(".filedocument").style.height = filelist[file.id].complete ? o.height + 10 + "px" : o.height + 5 + "px";
						filelist[file.id].thumbnailready = true;
					},
					error: function(){
						addDocument(filelist[file.id]);
						filelist[file.id].element.querySelector(".document").style.opacity = filelist[file.id].complete ? 1 : .5;
						filelist[file.id].thumbnail = false;
					}
				});
			}else{
				addDocument(filelist[file.id].element);
				filelist[file.id].element.querySelector(".document").style.opacity = filelist[file.id].complete ? 1 : .5;
			}
		},
		success: function(file){
			filelist[file.id].complete = true;

			filelist[file.id].progress.remove();

			var el = filelist[file.id].element;

			if(filelist[file.id].thumbnail){
				el.querySelector(".filedocument").style.height = o.height + 10 + "px";
				if(filelist[file.id].thumbnailready){
					el.querySelector(".thumbnail").style.opacity = 1;
				}
			}else{
				el.querySelector(".document").style.opacity = 1;
				el.querySelector(".filedocument").style.height = o.height + 5 + "px";
			}

			el.setAttribute("data-path", file.path);
			el.setAttribute("class", "ready");
			el.style.cursor = "pointer";
			el.style.color = "#333";
			el.addEventListener("click", function(){
				window.open(this.getAttribute("data-path"));
			}, false);
		},
		update: function(file){
			filelist[file.id].progress.setMaxValue(file.total);
			filelist[file.id].progress.update(file.loaded);
		},
		error: function(file){
			var el = filelist[file.id].element;

			el.querySelector(".filedocument").style.height = filelist[file.id].thumbnail ? o.height + 10 + "px" : o.height + 5 + "px";
			el.style.color = "#ff2222";
			filelist[file.id].progress.remove();
		},
		supported: function(){
			return thumbnail.supported();
		}
	};
}

function Thumbnail(){

	var filereader = new Filereader();
	var imageFactory = new ImageFactory();

	var createThumbnail = function(o){
		o.width *= 2;
		o.height *= 2;

		var canvas = new Canvas({
			width: o.width,
			height: o.height
		});

		var width = o.image.width;
		var height = o.image.height;

		if(width > o.width){
			height *= o.width / width;
			width = o.width;
		}
		if(height > o.height){
			width *= o.height / height;
			height = o.height;
		}

		var x = (o.width - width) / 2;
		var y = (o.height - height) / 2;

		canvas.ctx.drawImage(o.image, x, y, width, height);

		var dataURL = canvas.getDataURL();

		switch(o.dataType){
			case "dataURL":
				o.success(dataURL);
			break;
			case "image":
				imageFactory.create({
					url: dataURL,
					success: function(image){
						image.style.width = o.width / 2 + "px";
						image.style.height = o.height / 2 + "px";
						o.success(image);
					},
					error: function(){
						o.error();
					}
				});
			break;
			default:
				o.error();
			break;
		}
	};

	return {
		create: function(o){

			o = extend({
				width: 100,
				height: 60,
				dataType: "image",
				maxSize: 1024 * 1024 * 10,
				success: function(){},
				error: function(){}
			}, o);

			switch(typeof o.image){
				case "object":
					filereader.read({
						maxSize: o.maxSize,
						files: [
							o.image
						],
						success: function(e){
							imageFactory.create({
								url: e.data,
								success: function(image){
									o.image = image;
									createThumbnail(o);
								},
								error: function(){
									o.error();
								}
							});
						},
						error: function(){
							o.error();
						}
					});
				break;
				case "string":
					imageFactory.create({
						url: o.image,
						success: function(image){
							o.image = image;
							createThumbnail(o);
						},
						error: function(){
							o.error();
						}
					});
				break;
				default:
					o.error();
				break;
			}
		},
		supported: function(){
			return filereader.supported() && typeof window.HTMLCanvasElement != "undefined";
		}
	};
}

function Filereader(o){

	var o = extend({
		maxSize: 1024 * 1024 * 5
	}, o);

	var maxSize = o.maxSize;

	return {
		read: function(o){
			o = extend({
				maxSize: maxSize,
				files: [],
				success: function(){},
				error: function(){},
				sizelimit: function(){}
			}, o);

			var files = o.files;

			for(var i = 0, l = files.length; i < l; i++){

				if(files[i].size < o.maxSize){
					
					var filereader = new FileReader();

					filereader.name = files[i].name;
					filereader.size = files[i].size;
					filereader.id = typeof files[i].id != "undefined" ? files[i].id : null;

					filereader.onload = function(e){
						o.success({
							name: this.name,
							size: this.size,
							data: e.target.result,
							id: this.id
						});
					};
					filereader.onerror = function(){
						o.error({
							name: this.name,
							size: this.size,
							id: this.id
						});
					};

					filereader.readAsDataURL(files[i], "UTF-8");
				}else{
					o.sizelimit({
						name: files[i].name,
						size: files[i].size,
						maxSize: o.maxSize,
						id: typeof files[i].id != "undefined" ? files[i].id : null
					});
				}
			}
		},
		supported: function(){
			return typeof window.FileReader != "undefined";
		}
	};	
}

function Filesize(){

	return {
		convert: function(byte){
			var list = ["b", "kb", "mb", "gb", "tb", "eb", "zb", "yb"];

			var i = 0;
			while(byte / 1024 > 1){
				i++;
				byte /= 1024;
			}

			byte = Math.round(byte * 10) / 10;

			return byte + list[i];
		}
	}
}

function Filename(){

	return {
		adapt: function(o){
			var name = o.name;

			if(name.length > o.maxChar){
				name = name.substring(0, o.maxChar - 3) + "...";
			}

			return name;
		}
	}
}

function ProgressBar(o){
	
	o = extend({
		maxValue: 100,
		current: 0,
		width: 200,
		height: 3,
		parent: "body"
	}, o);

	if(typeof o.parent == "string"){
		o.parent = document.querySelector(o.parent);
	}

	var maxValue = o.maxValue > 0 ? o.maxValue : 100;
	var current = o.current <= maxValue && o.current >= 0 ? o.current : 0;
	var width = o.width;
	var height = o.height;
	

	var widthRatio = function(){
		return current / maxValue * width;
	};
	
	var wrapper = document.createElement("div");
	wrapper.setAttribute("class", "progressbar");
	wrapper.style.width = width + "px";
	wrapper.style.height = height + "px";
	wrapper.style.border = "1px solid #777";
	wrapper.style.borderRadius = "5px";
	wrapper.style.overflow = "hidden";
	
	var progress = document.createElement("div");
	progress.setAttribute("class", "progress");
	progress.style.width = widthRatio() + "px";
	
	wrapper.appendChild(progress);
	o.parent.appendChild(wrapper);
	
	return {
		update: function(i){
			if(i <= maxValue && i >= 0){
				current = i;
				
				progress.style.width = widthRatio() + "px";
			}
		},
		setMaxValue: function(i){
			if(i > 0){
				maxValue = i;
				
				if(current > maxValue){
					current = maxValue;
				}
				
				progress.style.width = widthRatio() + "px";
			}
		},
		remove: function(){
			wrapper.style.display = "none";
		}
	};	
}

function Canvas(o){
	
	o = extend({
		width: 100,
		height: 100
	}, o);

	var canvas = document.createElement("canvas");
	canvas.width = o.width;
	canvas.height = o.height;

	if(typeof o.parent != "undefined"){
		if(typeof o.parent == "string"){
			document.querySelector(o.parent).appendChild(canvas);
		}else if(typeof o.parent == "object" && typeof o.parent.appendChild != "undefined"){
			o.parent.appendChild(canvas);
		}
	}

	var ctx = canvas.getContext("2d");

	return {
		ctx: ctx,
		clear: function(){
			ctx.clearRect(0, 0, o.width, o.height);
		},
		getDataURL: function(){
			return canvas.toDataURL("image/png");
		}
	};
}

function extend(options, extend){
	if(typeof extend != "undefined"){
		for(var key in options){
			if(typeof extend[key] == "undefined"){
				extend[key] = options[key];
			}
		}
	}else{
		extend = options;
	}

	return extend;
}

function ajax(o){

	o = extend({
		url: "",
		type: "POST",
		dataType: "text",
		data: {},
		id: Date.now(),
		success: function(){},
		error: function(){},
		progress: function(){}
	}, o);

	var formData = new FormData();

	for(var key in o.data){
		formData.append(key, o.data[key]);
	}

	var xhr = new XMLHttpRequest();
	xhr.open(o.type, o.url, true);
	xhr.dataid = o.id;

	xhr.onload = function(e){
		if(this.status === 200){
			switch(o.dataType){
				case "text":
					o.success({
						data: this.response,
						id: this.dataid
					});
				break;
				case "json":
					try{
						o.success({
							data: JSON.parse(this.response),
							id: this.dataid
						});
					}catch(e){
						o.error({
							id: this.dataid
						});
					}
				break;
				default: 
					o.error({
						id: this.dataid
					});
				break;
			}
		}else{
			o.error({
				id: this.dataid
			});
		}
	};
	xhr.upload.onprogress = function(e){
		if(e.lengthComputable){
			o.progress({
				loaded: e.loaded,
				total: e.total,
				id: xhr.dataid
			});
		}
	};

	xhr.send(formData);
}

function ImageFactory(){

	return {
		create: function(o){

			o = extend({
				url: "",
				success: function(){},
				error: function(){}
			}, o);

			var image = new Image();

			image.onload = function(){
				o.success(this);
			};
			image.onerror = function(){
				o.error();
			};

			image.src = o.url;
		}
	}
}
import React from 'react';
import { withRouter } from 'react-router-dom';
import { Editor } from '@tinymce/tinymce-react';
import Button from '@material-ui/core/Button';

class ReceiptHtmlEditor extends React.Component {
    state = {
        receiptHtmlEditorData: "",
    }

    handleEditorChange = (content, editor) => {
        this.setState({ receiptHtmlEditorData: content }, () => {
            console.log("content", this.state.receiptHtmlEditorData)
        })
    }

    render() {
        return (
            <>
                <p style={{ marginBottom: "10px", fontSize: "17px", color: "#000", fontWeight: "600" }}>Receipt Template Generator</p>
                <Editor
                    apiKey="zlftcukcgdptiqbqdwd4x8splkjcgvmpp6okrurxptv508wz"
                    initialValue="<p>Enter...</p>"
                    init={{
                        height: 500,
                        menubar: false,
                        image_title: true,
                        automatic_uploads: true,
                        // toolbar9: 'myCustomToolbarButton',
                        // setup: function (editor) {
                        //     editor.ui.registry.addButton('myCustomToolbarButton', {
                        //         text: 'My Custom Button',
                        //         onAction: function (e) {
                        //             console.log(e)
                        //         }
                        //     });
                        // },
                        
                        file_picker_callback: function (cb, value, meta) {
                            var input = document.createElement('input');
                            input.setAttribute('type', 'file');
                            input.setAttribute('accept', 'image/*');

                            /*
                              Note: In modern browsers input[type="file"] is functional without
                              even adding it to the DOM, but that might not be the case in some older
                              or quirky browsers like IE, so you might want to add it to the DOM
                              just in case, and visually hide it. And do not forget do remove it
                              once you do not need it anymore.
                            */

                            input.onchange = function () {
                                var file = this.files[0];

                                var reader = new FileReader();
                                reader.onload = function () {
                                    /*
                                      Note: Now we need to register the blob in TinyMCEs image blob
                                      registry. In the next release this part hopefully won't be
                                      necessary, as we are looking to handle it internally.
                                    */
                                    var id = 'blobid' + (new Date()).getTime();
                                    var blobCache = window.tinymce.activeEditor.editorUpload.blobCache;
                                    // var blobCache = this.activeEditor.editorUpload.blobCache;
                                    var base64 = reader.result.split(',')[1];
                                    var blobInfo = blobCache.create(id, file, base64);
                                    blobCache.add(blobInfo);

                                    /* call the callback and populate the Title field with the file name */
                                    cb(blobInfo.blobUri(), { title: file.name });
                                };
                                reader.readAsDataURL(file);
                            };

                            input.click();
                        },
                        plugins: [
                            'advlist autolink lists link image charmap print preview anchor',
                            'searchreplace visualblocks code fullscreen table',
                            'insertdatetime media table paste code help wordcount image'
                        ],
                        toolbar:
                            'undo redo | formatselect | bold italic backcolor | \
                  alignleft aligncenter alignright alignjustify | \
                  bullist numlist outdent indent | removeformat | help | table | image '
                    }}
                    onEditorChange={this.handleEditorChange}
                />
                <Button variant="contained" style={{ float: "right", background: "#0052CC", color: "#fff", marginTop: "15px" }} >
                    SUBMIT
                </Button>
            </>
        );
    }
}

export default withRouter(ReceiptHtmlEditor);

